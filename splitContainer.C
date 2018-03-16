/// \file
/// \ingroup tutorial_http
///  This program creates and fills one and two dimensional histogram
///  Macro used to demonstrate usage of custom HTML page in custom.htm
///  One can use plain JavaScript to assign different actions with HTML buttons
///
/// \macro_code
///
/// \author Sergey Linev



#include <vector>
#include <string>
#include <iostream>
#include <sstream>

#include "THttpServer.h"

#include "TBufferJSON.h"
#include "TROOT.h"
#include "TSystem.h"
#include "TRandom.h"
#include "TFile.h"
#include "TGeoBBox.h"
#include "TGeoTube.h"

#include <ROOT/TWebWindowsManager.hxx>
#include <ROOT/TEveGeoShapeExtract.hxx>
#include <ROOT/TEveGeoShape.hxx>
#include <ROOT/TEveManager.hxx>
#include <ROOT/TEvePointSet.hxx>

#include "json.hpp"

namespace REX = ROOT::Experimental;


nlohmann::json streamTEveElement(REX::TEveElement* el, int guid)
{
   TString flatJS = TBufferJSON::ConvertToJSON(el, gROOT->GetClass("ROOT::Experimental::TEvePointSet"));
            
   auto j = nlohmann::json::parse(flatJS.Data());
   //j["name"] = el->GetElementName();
   j["guid"] = guid;

   return j;
}

REX::TEveElementList* eventList = 0;

class WHandler {
private:
   std::shared_ptr<ROOT::Experimental::TWebWindow>  fWindow;
   unsigned fConnId{0};

public:
   WHandler() {};
   
   virtual ~WHandler() { printf("Destructor!!!!\n"); }
   

 REX::TEvePointSet* getPointSet(int npoints = 2, float s=2, int color=4)
{
   TRandom r(0);
   REX::TEvePointSet* ps = new REX::TEvePointSet("fu");
   for (Int_t i=0; i<npoints; ++i)
   {
      ps->SetNextPoint(r.Uniform(-s,s), r.Uniform(-s,s), r.Uniform(-s,s));
   }

   ps->SetMarkerColor(color);
   ps->SetMarkerSize(r.Uniform(1, 2));
   ps->SetMarkerStyle(4);

   return ps;
}


   void ProcessData(unsigned connid, const std::string &arg)
   {
      printf("ProcessData %s >>>>>>>  \n", arg.c_str());
       if (arg == "CONN_READY") {
         fConnId = connid;
         printf("connection established %u\n", fConnId);
         
         TRandom r(0);
         Float_t s = 100;

         if (1) {
            //            TFile* geom =  TFile::Open("http://mtadel.home.cern.ch/mtadel/root/alice_mini_geom.root","CACHEREAD");
               TFile* geom =  TFile::Open("http://amraktad.web.cern.ch/amraktad/root/fake7geo.root", "CACHEREAD");
            //TFile* geom =  TFile::Open("fake7geo.root", "CACHEREAD");
                           
            if (!geom)
               return;
            auto gse = (ROOT::Experimental::TEveGeoShapeExtract*) geom->Get("Extract");
           auto gentle_geom = ROOT::Experimental::TEveGeoShape::ImportShapeExtract(gse, 0);
            geom->Close();
            delete geom;


            TString jsonGeo = TBufferJSON::ConvertToJSON(gse, gROOT->GetClass("ROOT::Experimental::TEveGeoShapeExtract"));


            nlohmann::json j;
            //j["controllers"] = {"3D"};
            j["function"] = "geometry";
            j["args"] = {nlohmann::json::parse(jsonGeo.Data())};
               
            printf("Sending geo json \n");
            fWindow->Send(j.dump(), fConnId);
         }
         if (1) {
            auto ps1 = getPointSet(200, 100, 3);
            ps1->SetElementName("PSTest_1");
            nlohmann::json se1 = streamTEveElement(ps1, 0); //getGUID());

            nlohmann::json jArr;
            jArr["arr"] = { se1 };
            jArr["guid"] = "77";
            jArr["_typename"] = "unknown";
            jArr["fName"] = "EventHolder";


            auto ps2 = getPointSet(10, 200, 4);
            ps2->SetElementName("PSTest_2");
            nlohmann::json se2 = streamTEveElement(ps2, 1); //getGUID());
            
            jArr["arr"].push_back(se2);

            nlohmann::json j;
            //j["controllers"] = {"3D"};
            j["function"] = "event";
            j["args"] = { jArr } ;
            
            fWindow->Send(j.dump(), fConnId);

            eventList = new REX::TEveElementList("Event");
            eventList->AddElement(ps1);
            eventList->AddElement(ps2);
            }
         return;
      }
      if (arg == "CONN_CLOSED") {
         printf("connection closed\n");
         fConnId = 0;
         return;
      }
      else {

         char cmd[128];
         sprintf(cmd, "((WHandler*)%p)->%s;", this, arg.c_str());
         printf("arg: %s\ncmd: %s\n", arg.c_str(), cmd);
         gROOT->ProcessLine(cmd);
         //gROOT->ProcessLine(arg.c_str());
      }
                     

   }
   
   void changeNumPoints(int id, int numPnts)
   {
      REX::TEveElementList::List_i it = eventList->BeginChildren();
 
      if (id >=  eventList->NumChildren()) {
         printf("error: changeNumPoints not an valid id !!! \n");
         return;
      }
      for (int i = 0; i < id; i++) it++;

      REX::TEvePointSet* ps = (REX::TEvePointSet*)(*it);
      ps->Reset(numPnts, 0);
      
      TRandom r(0);
      float s = r.Uniform(10, 200);
      for (Int_t i=0; i<numPnts; ++i)
      {
         ps->SetNextPoint(r.Uniform(-s,s), r.Uniform(-s,s), r.Uniform(-s,s));
      }
      nlohmann::json j;
      j["function"] = "replaceElement";
      j["element"] =   streamTEveElement(ps, id);

      fWindow->Send(j.dump(), fConnId);
   }
   
   void makeWebWindow(const std::string &where = "")
   {

      fWindow =  ROOT::Experimental::TWebWindowsManager::Instance()->CreateWindow(gROOT->IsBatch());
      // ?? AMT
      fWindow->GetServer()->AddLocation("/currentdir/", "/home/alja/future/splitContainer");

      fWindow->SetDefaultPage("file:index.html");

      // this is call-back, invoked when message received via websocket
      fWindow->SetDataCallBack([this](unsigned connid, const std::string &arg) { ProcessData(connid, arg); });

      fWindow->SetGeometry(300, 500); // configure predefined geometry 

      std::string url = fWindow->GetUrl(true);
      
   }

};


WHandler* handler = nullptr;

void splitContainer()
{
     gSystem->Load("libROOTEve");
     REX::TEveManager::Create();
   
     handler = new WHandler();
   handler->makeWebWindow();
}
