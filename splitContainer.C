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
#include <ROOT/TEveScene.hxx>
#include <ROOT/TEveElement.hxx>
#include <ROOT/TEveManager.hxx>
#include <ROOT/TEvePointSet.hxx>

#include <ROOT/TEveTrack.hxx>
#include <ROOT/TEveTrackPropagator.hxx>

#include "json.hpp"

namespace REX = ROOT::Experimental;

// globals
REX::TEveGeoShapeExtract* geo = 0;
REX::TEveManager* eveMng = 0;

struct Conn {
   unsigned m_id;

   Conn(): m_id(0) {}
   Conn(unsigned int cId) : m_id(cId) {}
};


class WHandler {
private:
   std::shared_ptr<ROOT::Experimental::TWebWindow>  fWindow;
   std::vector<Conn> m_connList;

public:
   WHandler() {};
   
   virtual ~WHandler() { printf("Destructor!!!!\n"); }
   

   void streamEveElement(REX::TEveElement* el,nlohmann::json& jsonParent )
   {
      // printf("BEGIN stream element %s \n", el->GetElementName() );
      
      TString flatJS = TBufferJSON::ConvertToJSON(el, el->IsA());  
      nlohmann::json cj =  nlohmann::json::parse(flatJS.Data());
      jsonParent["arr"].push_back(cj);

      
      cj["arr"] =  nlohmann::json::array();
      // printf(" stream >>>>>> %s %d parent = %s \n", el->GetElementName(),  el->NumChildren(), jsonParent.dump().c_str());
      for (auto it =  el->BeginChildren(); it != el->EndChildren(); ++it)
      {
         // printf(".... stream child %s of parent %s \n", (*it)->GetElementName(), el->GetElementName());
         streamEveElement(*it,  jsonParent["arr"][0]);
      }      
   }

   void ProcessData(unsigned connid, const std::string &arg)
   {
      if (arg == "CONN_READY") {
         m_connList.push_back(Conn(connid));
         printf("connection established %u\n", connid);
         

         if (1) {
            TString jsonGeo = TBufferJSON::ConvertToJSON(geo, gROOT->GetClass("ROOT::Experimental::TEveGeoShapeExtract"));
            nlohmann::json j;
            j["function"] = "geometry";
            j["args"] = {nlohmann::json::parse(jsonGeo.Data())};
               
            //printf("Sending geo json %s\n", j.dump().c_str());
            fWindow->Send(j.dump(), connid);
         }
         if (1) {
            nlohmann::json jTop;
            jTop["function"] = "event";
            nlohmann::json eventScene;
            eventScene["arr"] = nlohmann::json::array();
            streamEveElement(eveMng->GetEventScene(), eventScene);
            jTop["args"] = eventScene["arr"];
            fWindow->Send(jTop.dump(), connid);
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
   {/*
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
    */
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
      if (printSShFw) {
         printSshForward(url);
      }
      else {
         printf("URL %s\n", url.c_str());
      }
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

void makeTestScene()
{
   // geo
   //
   TFile* geom =  TFile::Open("http://amraktad.web.cern.ch/amraktad/root/fake7geo.root", "CACHEREAD");                           
   if (!geom)
      return;
   REX::TEveGeoShapeExtract* gse = (REX::TEveGeoShapeExtract*) geom->Get("Extract");
   geo = gse;
   // points
   //
   REX::TEveElement* event = eveMng->GetEventScene();
   auto ps1 = getPointSet(20, 100, 3);
   event->AddElement(ps1);


   
   auto ps2 = getPointSet(10, 200, 4);
   event->AddElement(ps2);

   // tracks
   //
   auto prop = new REX::TEveTrackPropagator();
   prop->SetMagFieldObj(new REX::TEveMagFieldDuo(350, -3.5, 2.0));
   prop->SetMaxR(1000);
   prop->SetMaxZ(1000);
   {
      TParticle* p = new TParticle();p->SetPdgCode(11);
      p->SetProductionVertex(0.068, 0.2401, -0.07629, 1);
      p->SetMomentum(4.82895, 2.35083, -0.611757, 1);
      auto track = new REX::TEveTrack(p, 1, prop);
      track->MakeTrack();
      track->SetElementName("TestTrack_1");
      event->AddElement(track);
   }
   {
      TParticle* p = new TParticle(); p->SetPdgCode(11);
      p->SetProductionVertex(0.068, 0.2401, -0.07629, 1);
      p->SetMomentum(-0.82895, 0.83, -1.1757, 1);
      auto track = new REX::TEveTrack(p, 1, prop);
      track->MakeTrack();
      event->AddElement(track);
      track->SetMainColor(kBlue);
      track->SetElementName("TestTrack_2");
   }
}


WHandler* handler = nullptr;

void splitContainer(bool printSShFw = false)
{
   gSystem->Load("libROOTEve");
   eveMng = REX::TEveManager::Create();
   makeTestScene();
   handler = new WHandler();
   handler->makeWebWindow("", printSShFw);
}
