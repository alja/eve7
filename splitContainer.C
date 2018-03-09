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


namespace REX = ROOT::Experimental;



class WHandler {
private:
   std::shared_ptr<ROOT::Experimental::TWebWindow>  fWindow;
   unsigned fConnId{0};

public:
   WHandler() {};
   
   virtual ~WHandler() { printf("Destructor!!!!\n"); }
   

REX::TEvePointSet* getPointSet(int npoints = 2, float s=2)
{
   TRandom r(0);
   REX::TEvePointSet* ps = new REX::TEvePointSet("fu");
   for (Int_t i=0; i<npoints; ++i)
   {
      ps->SetNextPoint(r.Uniform(-s,s), r.Uniform(-s,s), r.Uniform(-s,s));
   }

   ps->SetMarkerColor(TMath::Nint(r.Uniform(2, 9)));
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
         fWindow->Send("INITDONE", fConnId);

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


            TString json = TBufferJSON::ConvertToJSON(gse, gROOT->GetClass("ROOT::Experimental::TEveGeoShapeExtract"));
            printf("Sending geo json \n");
            fWindow->Send(std::string("GEO:") + json.Data(), fConnId);
         }
         if (1) {
            TList* list = new TList();
            auto ps = getPointSet(200, s);
            list->Add(ps);
            TString json = TBufferJSON::ConvertToJSON(list);
            printf("Sending json event\n");
            fWindow->Send(std::string("EXT:") + json.Data(), fConnId);
         }
         return;
      }
      if (arg == "CONN_CLOSED") {
         printf("connection closed\n");
         fConnId = 0;
         return;
      }



      
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
