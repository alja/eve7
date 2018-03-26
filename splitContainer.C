/// \file
/// \ingroup tutorial_http
///  This program creates and fills one and two dimensional histogram
///  Macro used to demonstrate usage of custom HTML page in custom.htm
///  One can use plain JavaScript to assign different actions with HTML buttons
///
/// \macro_code
///



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
#include "TParticle.h"

#include <ROOT/TWebWindowsManager.hxx>
#include <ROOT/TEveGeoShapeExtract.hxx>
#include <ROOT/TEveGeoShape.hxx>
#include <ROOT/TEveManager.hxx>
#include <ROOT/TEvePointSet.hxx>
#include <ROOT/TEveTrack.hxx>
#include <ROOT/TEveTrackPropagator.hxx>

#include "json.hpp"

namespace REX = ROOT::Experimental;

struct Conn {
   unsigned m_id;

   Conn(): m_id(0) {}
   Conn(unsigned int cId) : m_id(cId) {}
};

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
   std::vector<Conn> m_connList;

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
      if (arg == "CONN_READY") {
         m_connList.push_back(Conn(connid));
         printf("connection established %u\n", connid);
         
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
            fWindow->Send(j.dump(), connid);
         }
         if (1) {
            // top event
            eventList = new REX::TEveElementList("Event");
            
            nlohmann::json jArr;
            jArr["arr"] = { };
            jArr["guid"] = "77";
            jArr["_typename"] = "unknown";
            jArr["fName"] = "EventHolder";


            // points
            //
            auto ps1 = getPointSet(200, 100, 3);
            ps1->SetElementName("PSTest_1");
            eventList->AddElement(ps1); // ?
            nlohmann::json se1 = streamTEveElement(ps1, 0); //getGUID());
            jArr["arr"].push_back(se1);

            auto ps2 = getPointSet(10, 200, 4);
            eventList->AddElement(ps2); // ?
            ps2->SetElementName("PSTest_2");
            nlohmann::json se2 = streamTEveElement(ps2, 1); //getGUID());
            jArr["arr"].push_back(se2);

            // tracks
            //
            auto prop = new REX::TEveTrackPropagator();
            prop->SetMagFieldObj(new REX::TEveMagFieldDuo(350, -3.5, 2.0));
            prop->SetMaxR(1000);
            prop->SetMaxZ(1000);
            
            if (1) {
               TParticle* p = new TParticle();p->SetPdgCode(11);
               p->SetProductionVertex(0.068, 0.2401, -0.07629, 1);
               p->SetMomentum(4.82895, 2.35083, -0.611757, 1);
               auto track = new REX::TEveTrack(p, 1, prop);
               track->MakeTrack();
               eventList->AddElement(track);

               track->SetElementName("TestTrack_1");
               nlohmann::json tr1 = streamTEveElement(track, 2); //getGUID());
               jArr["arr"].push_back(tr1);
               }
            if (1) {
               TParticle* p = new TParticle(); p->SetPdgCode(11);
               p->SetProductionVertex(0.068, 0.2401, -0.07629, 1);
               p->SetMomentum(-0.82895, 0.83, -1.1757, 1);
               auto track = new REX::TEveTrack(p, 1, prop);
               track->MakeTrack();
               eventList->AddElement(track);
               track->SetMainColor(kBlue);
               track->SetElementName("TestTrack_2");
               nlohmann::json tr2 = streamTEveElement(track, 3); //getGUID());
               jArr["arr"].push_back(tr2);
            }
         

            // send event with action instructions
            //
             nlohmann::json j;
            j["function"] = "event";
            j["args"] = { jArr } ;
            fWindow->Send(j.dump(), connid);
            
         }
         return;
      }

      // find connection object
      std::vector<Conn>::iterator conn =  m_connList.end();
      for (auto i = m_connList.begin(); i != m_connList.end(); ++i)
      {
         if (i->m_id == connid)
         {
            conn = i;
            break;
         }
      }
      // this should not happen, just check
      if (conn == m_connList.end()) {
         printf("error, conenction not found!");
         return;
      }
       
      if (arg == "CONN_CLOSED") {
         printf("connection closed\n");
         m_connList.erase(conn);
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
      for (auto i = m_connList.begin(); i != m_connList.end(); ++i)
      {
         fWindow->Send(j.dump(), i->m_id);
      }
   }
   
   void makeWebWindow(const std::string &where = "", bool printSShFw = false)
   {

      fWindow =  ROOT::Experimental::TWebWindowsManager::Instance()->CreateWindow(gROOT->IsBatch());
      // ?? AMT
      fWindow->GetServer()->AddLocation("/currentdir/", "/home/alja/future/splitContainer");

      fWindow->SetDefaultPage("file:index.html");

      // this is call-back, invoked when message received via websocket
      fWindow->SetDataCallBack([this](unsigned connid, const std::string &arg) { ProcessData(connid, arg); });

      fWindow->SetGeometry(300, 500); // configure predefined geometry 

      fWindow->SetConnLimit(100);
   
      std::string url = fWindow->GetUrl(true);
      if (printSShFw) printSshForward(url);
   }


   void printSshForward(std::string url)
   {
      printf("original URL=%s\n", url.c_str());
      auto x = url.substr(0,  url.find("/web7gui/win1/") );
      x=x.substr(7);
      auto port  = x.substr(x.find(':')+1);

      int localport = 1234;
      // printf("port %s\n", port.c_str());
      // printf("hostname %s\n", gSystem->HostName());
      printf("SSH TUNNEL  ########################### \n");//, port.c_str(), localport);
      printf("ssh -f -L %d:localhost:%s %s sleep 10000\n",localport, port.c_str(), gSystem->HostName() );
      printf("http://localhost:%d/web7gui/win1/\n", localport);
   }

};


WHandler* handler = nullptr;

void splitContainer(bool printSShFw = false)
{
   gSystem->Load("libROOTEve");
   REX::TEveManager::Create();
   
   handler = new WHandler();
   handler->makeWebWindow("", printSShFw);
}
