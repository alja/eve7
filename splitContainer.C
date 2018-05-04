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
#include <ROOT/TEveProjectionBases.hxx>
#include <ROOT/TEveManager.hxx>
#include <ROOT/TEveProjectionManager.hxx>
#include <ROOT/TEvePointSet.hxx>

#include <ROOT/TEveTrack.hxx>
#include <ROOT/TEveTrackPropagator.hxx>

#include "json.hpp"

namespace REX = ROOT::Experimental;

// globals
REX::TEveGeoShapeExtract* topGeo = 0;
REX::TEveManager* eveMng = 0;
REX::TEveProjectionManager* mngRhoPhi = 0;
REX::TEveProjectionManager* mngRhoZ = 0;

struct Conn {
   unsigned m_id;

   Conn(): m_id(0) {}
   Conn(unsigned int cId) : m_id(cId) {}
};

class RenderDataViewType
{
public:
   nlohmann::json header;
   char*          buffer;
   size_t         bufferSize;


   size_t writeToMemory(char* dest, int off) {
      std::string head = header.dump();
      size_t hs = head.length();
      printf("writeToMemory HEAD %s off=[%d] size=[%zu] \n",head.c_str(), off, hs);
      memcpy(dest + off, head.c_str(), hs);


      off = ceil((int(hs)+off)/4.0)*4;

      
      printf("writeToMemory BIN  off=[%d] size=[%zu] \n", off, bufferSize);
      memcpy(dest+off, buffer, bufferSize);
      off += bufferSize;
      printf("writeToMemory exit  off=[%d] \n", off);
      return off;
   }
   
   ClassDef(RenderDataViewType, 1);
};

class RenderData {
public:
   RenderData(REX::TEveElement* el){
      header["guid"]    = el->GetElementId();
      // need for decoding on client side
      header["hsArr"] = nlohmann::json::array();
      header["bsArr"] = nlohmann::json::array();
   }

   void updateViewTypeSizeArray() {
      header["hsArr"].clear();
      header["bsArr"].clear();
      for (auto it =  reps.begin(); it != reps.end(); ++it)
      {
         int hs = it->header.dump().length();
         header["hsArr"].push_back(hs);
         header["bsArr"].push_back(it->bufferSize);
      }
   }

   int getTotalSizeOfViewTypeData(int coreOff) {
      int nt = header["hsArr"].size();
      int off = coreOff;
      for (int i = 0; i < nt; ++i)
      {
         int hs = header["hsArr"].at(i);
         off = 4* ceil((off + hs)/4.0);
         // presume we are saving floats or ints!!
         int bs = header["bsArr"].at(i);
         off += bs;
      }
      
      /*
      printf("getTotalSizeOfViewTypeData %s\n ", header.dump().c_str());
      for (nlohmann::json::iterator it = header["hsArr"].begin(); it != header["hsArr"].end(); ++it) {
         float ff = float(*it)/4.0;
         int headOff = ceil(ff)*4;
         printf("getTotalSizeOfViewTypeData head size %d\n ", headOff);
         n += headOff;
      }
      
      for (nlohmann::json::iterator it = header["bsArr"].begin(); it != header["bsArr"].end(); ++it) {
         int off = *it;
         printf("getTotalSizeOfViewTypeData buffer size %d \n", off);
         n += off;
      }
      */
      int n = off - coreOff; 
      printf("exit getTotalSize of view type info!!! %d \n", n);
      return n;
   }
   
   nlohmann::json header;   
   std::vector<RenderDataViewType>  reps;
   ClassDef(RenderData, 1);
};


class WHandler {
private:
   std::shared_ptr<ROOT::Experimental::TWebWindow>  fWindow;
   std::vector<Conn> m_connList;

public:
   WHandler() {};
   
   virtual ~WHandler() { printf("Destructor!!!!\n"); }
   

   void streamEveElementCore(REX::TEveElement* el, nlohmann::json& jsonParent )
   {
      // printf("BEGIN stream element %s \n", el->GetElementName() );
      nlohmann::json cj;
      getElementCoreJson(el, cj);
      jsonParent["arr"].push_back(cj);

      int loci = jsonParent["arr"].size() -1;
      
      cj["arr"] =  nlohmann::json::array();
      // printf(" stream >>>>>> %s %d parent = %s \n", el->GetElementName(),  el->NumChildren(), jsonParent.dump().c_str());
      for (auto it =  el->BeginChildren(); it != el->EndChildren(); ++it)
      {
         // printf(".... stream child %s of parent %s \n", (*it)->GetElementName(), el->GetElementName());
         streamEveElementCore(*it, jsonParent["arr"][loci] );
      }      
   }

   void getElementCoreJson(REX::TEveElement* el, nlohmann::json& cj)
   {
      cj["fName"] = el->GetElementName();
      cj["guid"] = el->GetElementId();
      cj["fRnrSelf"] = el->GetRnrSelf();
      cj["fRnrChildren"] = el->GetRnrChildren();

      TObject* o = dynamic_cast<TObject*>(el);
      if (o)
          cj["_typename"] = o->ClassName();
      else
          cj["_typename"] = "undefined";
   }
   
   void sendRenderData(REX::TEveElement* el, unsigned connid)
   {
      if (el->GetUserData()) {
         RenderData* rd = (RenderData*) el->GetUserData();
         std::string headerFlat = rd->header.dump();
         int hsf = int(headerFlat.size());
         
         printf("-----------------sendRender data %s\n", el->GetElementName());
         int totalRenderDataSize = rd->getTotalSizeOfViewTypeData(hsf+sizeof(int));
         int totalSize = headerFlat.size() + totalRenderDataSize + sizeof(int);
         printf("CORE headSize = %d , totalSize = %d   \n",hsf, totalSize );
         char* buff = (char*)malloc(totalSize);

         int off = 0;

         // first top header size
         memcpy(buff, &hsf, sizeof(int));
         off += sizeof(int);
      
         // write size of client data header, core information
         memcpy(buff + off, headerFlat.c_str(), headerFlat.size());
         off += headerFlat.size();

         
         // write view type representations
         for (auto it = rd->reps.begin(); it != rd->reps.end(); ++it)
         {
            off = it->writeToMemory(buff, off);
            //off += n;
         }

         printf("total %d off %d\n", totalSize, off);

         fWindow->SendBinary(connid, buff, totalSize);
         
         // free(buff);
        }
         for (auto it = el->BeginChildren(); it != el->EndChildren(); ++it)
            sendRenderData(*it, connid);
    
   }

   
   void ProcessData(unsigned connid, const std::string &arg)
   {
      if (arg == "CONN_READY") {
         m_connList.push_back(Conn(connid));
         printf("connection established %u\n", connid);
         
         if (1) {
            TString jsonGeo = TBufferJSON::ConvertToJSON(topGeo, gROOT->GetClass("ROOT::Experimental::TEveGeoShapeExtract"));
            nlohmann::json j;
            j["function"] = "geometry";
            j["args"] = {nlohmann::json::parse(jsonGeo.Data())};
               
            //  printf("Sending geo json %s\n", j.dump().c_str());
            fWindow->Send(connid, j.dump());
            //sleep(5);
         }
         if (1) {
            
            // beginChanges
            nlohmann::json cj;
            cj["function"] = "endChanges";
            cj["val"] = 0;
            fWindow->Send(connid, cj.dump());
            
            // core structure
            nlohmann::json jTop;
            jTop["function"] = "event";
            nlohmann::json eventScene;
            eventScene["arr"] = nlohmann::json::array();
            streamEveElementCore(eveMng->GetEventScene(), eventScene);
            
            // printf("send scene %s \n", eventScene.dump().c_str());
            jTop["args"] = eventScene["arr"];
            fWindow->Send(connid,jTop.dump());
            // render info
            sendRenderData(eveMng->GetEventScene(), connid);
            // endChanges
            cj["val"] = 1;
            fWindow->Send(connid, cj.dump());
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
         nlohmann::json cj =  nlohmann::json::parse(arg.c_str());
         std::string mir =  cj["mir"];
         std::string ctype =  cj["class"];
         int id = cj["guid"];
      
         auto el =  eveMng->FindElementById(id);
         char cmd[128];
         sprintf(cmd, "((%s*)%p)->%s;", ctype.c_str(), el, mir.c_str());
         // printf("cmd %s\n", cmd);
         gROOT->ProcessLine(cmd);
      
         nlohmann::json resp;
         resp["function"] = "replaceElement";

         nlohmann::json ce;
         getElementCoreJson(el, cj);
         resp["element"] = ce; 
         
         for (auto i = m_connList.begin(); i != m_connList.end(); ++i)
         {
            fWindow->Send(i->m_id, resp.dump());
         }     
      }
   }
   
   void makeWebWindow(const std::string &where = "", bool printSShFw = false)
   {
      fWindow =  ROOT::Experimental::TWebWindowsManager::Instance()->CreateWindow(gROOT->IsBatch());

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
   ps->Reset(npoints);

   for (Int_t i=0; i<npoints; ++i)
      ps->SetPoint(i, r.Uniform(-s,s),r.Uniform(-s,s),r.Uniform(-s,s));
      
   ps->SetMarkerColor(color);
   ps->SetMarkerSize(r.Uniform(1, 2));
   ps->SetMarkerStyle(4);

   return ps;
}


REX::TEveGeoShapeExtract* getShapeExtract(REX::TEveGeoShape* gs)
{
      auto ese = new REX::TEveGeoShapeExtract();
      ese->SetName(gs->GetElementName());
      ese->SetShape(gs->GetShape());
      TColor* c = gROOT->GetColor(gs->GetMainColor());
      float rgba [4] = {c->GetRed(), c->GetGreen(), c->GetBlue(), 1 - float(gs->GetMainTransparency())/100};
      ese->SetRGBA(rgba);
      return ese;
}


void makeTestScene()
{
   // geo
   //
   
   topGeo = new REX::TEveGeoShapeExtract("testGeometry3D");
   
   const Double_t kR_min = 240;
   const Double_t kR_max = 250;
   const Double_t kZ_d   = 300;

   auto b1 = new REX::TEveGeoShape("Barell 1");
   b1->SetShape(new TGeoTube(kR_min, kR_max, kZ_d));
   b1->SetMainColor(kCyan);
   b1->SetMainTransparency(80);
   topGeo->AddElement(getShapeExtract(b1));

   auto b2 = new REX::TEveGeoShape("Barell 2");
   b2->SetShape(new TGeoTube(2*kR_min, 2*kR_max, 2*kZ_d));
   b2->SetMainColor(kPink-3);
   b2->SetMainTransparency(80);
   topGeo->AddElement(getShapeExtract(b2));

   // points
   //
   REX::TEveElement* pntHolder = new REX::TEveElementList("Hits");
   
   REX::TEveElement* event = eveMng->GetEventScene();
   auto ps1 = getPointSet(20, 100, 3);
   ps1->SetElementName("Points_1");
   pntHolder->AddElement(ps1);

   /*
   auto ps2 = getPointSet(10, 200, 4);
   ps2->SetElementName("Points_2");
   pntHolder->AddElement(ps2);
   */
   event->AddElement(pntHolder);
   /*
   // tracks
   //
   auto prop = new REX::TEveTrackPropagator();
   prop->SetMagFieldObj(new REX::TEveMagFieldDuo(350, -3.5, 2.0));
   prop->SetMaxR(1000);
   prop->SetMaxZ(1000);
   REX::TEveElement* trackHolder = new REX::TEveElementList("Tracks");
   if (1)   {
      TParticle* p = new TParticle();p->SetPdgCode(11);
      p->SetProductionVertex(0.068, 0.2401, -0.07629, 1);
      p->SetMomentum(4.82895, 2.35083, -0.611757, 1);
      auto track = new REX::TEveTrack(p, 1, prop);
      track->MakeTrack();
      track->SetElementName("TestTrack_1");
      trackHolder->AddElement(track);
   }

   {
      TParticle* p = new TParticle(); p->SetPdgCode(11);
      p->SetProductionVertex(0.068, 0.2401, -0.07629, 1);
       p->SetMomentum(-0.82895, 0.83, -1.1757, 1);
      auto track = new REX::TEveTrack(p, 1, prop);
      track->MakeTrack();
      track->SetMainColor(kBlue);
      track->SetElementName("TestTrack_2");
      trackHolder->AddElement(track);
   }
   event->AddElement(trackHolder);
   */
}


void makeClientDataFromTrack(REX::TEveTrack* track, RenderData* rd, std::string type)
{
   rd->reps.push_back(RenderDataViewType());
   RenderDataViewType& data = rd->reps.back();
   
   data.header["viewType"] = type;
   data.header["rnrFunc"] = "makeTrack";
   data.header["npoints"] = track->GetN();
   data.buffer = (char*)track->GetP();
   data.bufferSize = track->GetN()*4;   

   for (auto pit = track->BeginProjecteds(); pit != track->EndProjecteds(); ++pit)
   {
      REX::TEveProjected* projected = *pit;
      REX::TEveTrack* projTrack = dynamic_cast<REX::TEveTrack*>(projected);      
      makeClientDataFromTrack(projTrack, rd, projected->GetManager()->GetProjection()->GetName());
   }
   
}

void makeClientDataFromPointSet(REX::TEvePointSet* hit,  RenderData* rd, std::string type)
{
   rd->reps.push_back(RenderDataViewType());
   RenderDataViewType& vtd = rd->reps.back();
   
   vtd.header["viewType"] = type;
   vtd.header["rnrFunc"] = "makeHit";
   vtd.header["npoints"] = hit->GetN();
   vtd.buffer = (char*)hit->GetP();

   // test
   float* x = hit->GetP();
   for (int i = 0; i < hit->GetN(); ++i) {
      printf("%d %f\n", i, x[i]);
   }
   vtd.bufferSize = hit->GetN()*4;
   
   for (auto pit = hit->BeginProjecteds(); pit != hit->EndProjecteds(); ++pit)
   {
      REX::TEveProjected* projected = *pit;
      REX::TEvePointSet* projPointSet = dynamic_cast<REX::TEvePointSet*>(projected);
      makeClientDataFromPointSet(projPointSet, rd, projected->GetManager()->GetProjection()->GetName());
   }
}

void createStreamableRenderData(REX::TEveElement* el)
{
   // AMT this should be part of TEveElement specific type classes

   RenderData* rd = 0;
   
   if (dynamic_cast<ROOT::Experimental::TEveTrack*>(el))
   {
      rd =  new RenderData(el);
      makeClientDataFromTrack((REX::TEveTrack*)el, rd, "3D");
   }
   else if (dynamic_cast<ROOT::Experimental::TEvePointSet*>(el))
   {
      rd =  new RenderData(el);
      makeClientDataFromPointSet((ROOT::Experimental::TEvePointSet*)el, rd, "3D");
   }
   if (rd) {
      rd->updateViewTypeSizeArray();
      el->SetUserData(rd);
   }
   
   for (auto it =  el->BeginChildren(); it != el->EndChildren(); ++it)
      createStreamableRenderData(*it);

   
}

WHandler* handler = nullptr;

void splitContainer(bool printSShFw = false)
{
   gSystem->Load("libROOTEve");
   eveMng = REX::TEveManager::Create();
   
   makeTestScene();
   
   // project geometry and event scene
   mngRhoPhi = new REX::TEveProjectionManager(REX::TEveProjection::kPT_RPhi);      
    mngRhoPhi->ImportElements(REX::gEve->GetGlobalScene());    
     mngRhoPhi->ImportElements(REX::gEve->GetEventScene());

   
   // project geometry and event scene
   mngRhoZ = new REX::TEveProjectionManager(REX::TEveProjection::kPT_RhoZ); 
   //mngRhoZ->ImportElements(REX::gEve->GetGlobalScene());
   //mngRhoZ->ImportElements(REX::gEve->GetEventScene());

   createStreamableRenderData(REX::gEve->GetEventScene());
   
   handler = new WHandler();
   handler->makeWebWindow("", printSShFw);
}
