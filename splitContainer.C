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
#include <ROOT/TEveProjectionManager.hxx>
#include <ROOT/TEveProjectionBases.hxx>
#include <ROOT/TEvePointSet.hxx>
#include <ROOT/TEveJetCone.hxx>

#include <ROOT/TEveTrack.hxx>
#include <ROOT/TEveTrackPropagator.hxx>

#include <ROOT/json.hxx>

namespace REX = ROOT::Experimental;

using RenderData = REX::RenderData;

// globals
REX::TEveGeoShapeExtract* topGeo = 0;
REX::TEveManager* eveMng = 0;

REX::TEveProjectionManager* mngRhoPhi = 0;
REX::TEveProjectionManager* mngRhoZ = 0;

struct Conn
{
   unsigned fId;

   Conn() : fId(0) {}
   Conn(unsigned int cId) : fId(cId) {}
};

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
class WHandler
{
private:
   std::shared_ptr<ROOT::Experimental::TWebWindow>  fWindow;
   std::vector<Conn>                                fConnList;

public:
   WHandler() {};
   
   virtual ~WHandler() { printf("Destructor!!!!\n"); }
   

   void streamEveElement(REX::TEveElement* el,nlohmann::json& jsonParent )
   {
      // printf("BEGIN stream element %s \n", el->GetElementName() );

      nlohmann::json cj;
      el->SetCoreJson(cj);

      // unrelated temporary here
      if (! el->GetUserData())
         el->BuildRenderData(); 
      
      jsonParent["arr"].push_back(cj);

      int loci = jsonParent["arr"].size() -1;
      
      cj["arr"] =  nlohmann::json::array();
      // printf(" stream >>>>>> %s %d parent = %s \n", el->GetElementName(),  el->NumChildren(), jsonParent.dump().c_str());
      for (auto it =  el->BeginChildren(); it != el->EndChildren(); ++it)
      {
         // printf(".... stream child %s of parent %s \n", (*it)->GetElementName(), el->GetElementName());
         streamEveElement(*it, jsonParent["arr"][loci] );
      }      
   }

   void sendRenderData(REX::TEveElement* el, unsigned connid)
   {
      if (el->GetUserData()) {

         // printf("send render data %s\n", el->GetElementName());
         
         nlohmann::json topRnrHeader;
         topRnrHeader["guid"] = el->GetElementId();         
         topRnrHeader["hsArr"] = nlohmann::json::array();
         topRnrHeader["bsArr"] = nlohmann::json::array();
         
         std::vector<REX::RenderData*> reps;
         REX::RenderData* rd3D = (REX::RenderData*)(el->GetUserData());
         rd3D->fHeader["viewType"] = "3D";
         reps.push_back(rd3D);

         // AMT presume object has a user data is also prectab;e
         REX::TEveProjectable* projectable = dynamic_cast<REX::TEveProjectable*>(el);
         if (projectable && projectable->HasProjecteds()){
            // printf("collect prjected begin >>>>>>>> \n");
            int y = 0;
            for (auto pit = projectable->BeginProjecteds(); pit != projectable->EndProjecteds(); ++pit)
            {

               REX::TEveProjected* ep = *pit;
               REX::TEveElement* pEl = dynamic_cast<REX::TEveElement*>(ep);
               if (pEl) {
                  // printf("collect projected loop %d %s \n", y++, ep->GetManager()->GetProjection()->GetName());
                  // AMT this should be handled with import
                  if (!pEl->GetUserData()) pEl->BuildRenderData();
                  if (pEl->GetUserData()) {
                     // printf("projected %s %p\n", pEl->GetElementName(), pEl->GetUserData());
                  
                     REX::RenderData* rdp = ( REX::RenderData*)(pEl->GetUserData());

                     rdp->fHeader["viewType"] = ep->GetManager()->GetProjection()->GetName();
                     // printf("set header %s\n", rdp->fHeader.dump().c_str());
                     // rdp->dump();
                     reps.push_back(rdp);
                  }
               }
            }
            // printf("end collecting view types\n");
         }
         
         
         size_t totalSizeViewTypes =0;
         for (auto it=reps.begin(); it != reps.end(); ++it)
         {
            REX::RenderData* rd = *it;
            topRnrHeader["hsArr"].push_back(rd->GetHeaderSize());
            size_t ts = rd->GetTotalSize();
            topRnrHeader["bsArr"].push_back(ts);
            totalSizeViewTypes += ts;
         }
         // printf("total size viewType %d\n", (int)totalSizeViewTypes);

         std::string topRnrHeaderFlat = topRnrHeader.dump();
         size_t thsRound = 4* int(ceil(topRnrHeaderFlat.size()/4.0));
         size_t pkgSize = sizeof(int) + thsRound + totalSizeViewTypes;
         char* pkgBuff = (char*)malloc(pkgSize);

         int off = 0;
         
         // first write size of top header
         int ts = topRnrHeaderFlat.size();
         memcpy(pkgBuff, &ts, sizeof(int));
         off += sizeof(int);

         // write top header
         memcpy(pkgBuff+off, topRnrHeaderFlat.c_str(), topRnrHeaderFlat.size());
         off += thsRound;
         for (auto it=reps.begin(); it != reps.end(); ++it){
            REX::RenderData* rd = *it;
            int bw = rd->Write(pkgBuff+off);
            //rd->dump();
            off += bw; 
         }

         // printf("total %d off %d\n", (int)pkgSize, off);

         fWindow->SendBinary(connid, pkgBuff, pkgSize);

         // printf("send binary end\n");
      }

      // printf("send rnr data loop children \n");
      for (auto it = el->BeginChildren(); it != el->EndChildren(); ++it)
         sendRenderData(*it, connid);
   }

   
   void ProcessData(unsigned connid, const std::string &arg)
   {
      if (arg == "CONN_READY") {
         fConnList.push_back(Conn(connid));
         printf("connection established %u\n", connid);
         
         if (1) {
            TString jsonGeo = TBufferJSON::ConvertToJSON(topGeo, gROOT->GetClass("ROOT::Experimental::TEveGeoShapeExtract"));
            nlohmann::json j;
            j["function"] = "geometry";
            j["args"] = {nlohmann::json::parse(jsonGeo.Data())};
            j["3D"] = {nlohmann::json::parse(jsonGeo.Data())};
               
            float dz = 10;
            {
               auto fake = new REX::TEveGeoShapeExtract(mngRhoPhi->GetProjection()->GetName());
               
               TGeoTube* box = new TGeoTube( 240, 250, dz);

               REX::TEveGeoShape* shape = new REX::TEveGeoShape;
               shape->SetShape(box);
               shape->SetMainColor(kCyan);
               shape->SetMainTransparency(80);
               fake->AddElement(getShapeExtract(shape));
               
               TString jsonFake = TBufferJSON::ConvertToJSON(fake, gROOT->GetClass("ROOT::Experimental::TEveGeoShapeExtract"));
               j[mngRhoPhi->GetProjection()->GetName()] = {nlohmann::json::parse(jsonFake.Data())};
            }

            { auto fake = new REX::TEveGeoShapeExtract(mngRhoPhi->GetProjection()->GetName());
               
               TGeoBBox* box = new TGeoBBox( 300, 250, dz);
               REX::TEveGeoShape* shape = new REX::TEveGeoShape;
               shape->SetMainColor(kCyan);
               shape->SetShape(box);
               shape->SetMainTransparency(80);
               fake->AddElement(getShapeExtract(shape));
               
               TString jsonFake = TBufferJSON::ConvertToJSON(fake, gROOT->GetClass("ROOT::Experimental::TEveGeoShapeExtract"));
               j[mngRhoZ->GetProjection()->GetName()] = {nlohmann::json::parse(jsonFake.Data())};
            }
              
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
            streamEveElement(eveMng->GetEventScene(), eventScene);
            
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
      std::vector<Conn>::iterator conn =  fConnList.end();
      for (auto i = fConnList.begin(); i != fConnList.end(); ++i)
      {
         if (i->fId == connid)
         {
            conn = i;
            break;
         }
      }
      // this should not happen, just check
      if (conn == fConnList.end()) {
         printf("error, conenction not found!");
         return;
      }
       
      if (arg == "CONN_CLOSED") {
         printf("connection closed\n");
         fConnList.erase(conn);
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
         el->SetCoreJson(resp);
         for (auto i = fConnList.begin(); i != fConnList.end(); ++i)
         {
            fWindow->Send(i->fId, resp.dump());
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

REX::TEvePointSet* getPointSet(int npoints = 2, float s=2, int color=28)
{
   TRandom r(0);
   REX::TEvePointSet* ps = new REX::TEvePointSet("fu", npoints);

   for (Int_t i=0; i<npoints; ++i)
         ps->SetNextPoint(r.Uniform(-s,s), r.Uniform(-s,s), r.Uniform(-s,s));
   
   ps->SetMarkerColor(color);
   ps->SetMarkerSize(3+r.Uniform(1, 2));
   ps->SetMarkerStyle(4);
   return ps;
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

   REX::TEveElement* event = eveMng->GetEventScene();
   // points
   //
  
   
   REX::TEveElement* pntHolder = new REX::TEveElementList("Hits");
   auto ps1 = getPointSet(20, 100);
   ps1->SetElementName("Points_1");
   pntHolder->AddElement(ps1);
   /*
   auto ps2 = getPointSet(10, 200, 4);
   ps2->SetElementName("Points_2");
   pntHolder->AddElement(ps2);
   */
   event->AddElement(pntHolder);


   // tracks
   //
   auto prop = new REX::TEveTrackPropagator();
   prop->SetMagFieldObj(new REX::TEveMagFieldDuo(350, -3.5, 2.0));
   prop->SetMaxR(300);
   prop->SetMaxZ(600);
   prop->SetMaxOrbs(6);
   REX::TEveElement* trackHolder = new REX::TEveElementList("Tracks");
   if (1)   {
      TParticle* p = new TParticle();p->SetPdgCode(11);
      p->SetProductionVertex(0.068, 0.2401, -0.07629, 1);
      p->SetMomentum(4.82895, 2.35083, -0.611757, 1);
      auto track = new REX::TEveTrack(p, 1, prop);
      track->MakeTrack();
      track->SetMainColor(kBlue);
      track->SetElementName("TestTrack_1");
      trackHolder->AddElement(track);
   }

   if (1) {
      TParticle* p = new TParticle(); p->SetPdgCode(11);
      p->SetProductionVertex(0.068, 0.2401, -0.07629, 1);
       p->SetMomentum(-0.82895, 0.83, -1.1757, 1);
      auto track = new REX::TEveTrack(p, 1, prop);
      track->MakeTrack();
      track->SetMainColor(kBlue);
      track->SetElementName("TestTrack_2");
      trackHolder->AddElement(track);
   }
   {
      double v = 0.5;
      double m = 5;
      TRandom r(0);
      for (int i = 0; i < 10; i++)
      {
         TParticle* p = new TParticle(); p->SetPdgCode(11);

         p->SetProductionVertex(r.Uniform(-v,v), r.Uniform(-v,v), r.Uniform(-v,v), 1);
         p->SetMomentum(r.Uniform(-m,m), r.Uniform(-m,m), r.Uniform(-m,m)*r.Uniform(1, 3), 1);
         auto track = new REX::TEveTrack(p, 1, prop);
         track->MakeTrack();
         track->SetMainColor(kBlue);
         track->SetElementName(Form("RandomTrack_%d",i ));
         trackHolder->AddElement(track);
      }
   }
   event->AddElement(trackHolder);

   
   // jets
   auto jetHolder = new REX::TEveElementList("Jets");
   {
      auto jet = new REX::TEveJetCone("Jet_1");
      jet->SetCylinder(2*kR_max, 2*kZ_d);
      jet->AddEllipticCone(0.7, 1, 0.1, 0.3);

      jetHolder->AddElement(jet);
   }
   event->AddElement(jetHolder);

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
   mngRhoZ->ImportElements(REX::gEve->GetGlobalScene());
   mngRhoZ->ImportElements(REX::gEve->GetEventScene());

   handler = new WHandler();
   handler->makeWebWindow("", printSShFw);
}
