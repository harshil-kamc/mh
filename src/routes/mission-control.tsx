import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Radio, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/mission-control")({
  head: () => ({
    meta: [
      { title: "Mission Control Demo — The Mystery Vault" },
      {
        name: "description",
        content:
          "Explore a simulated operations center for The Mystery Vault technology competition.",
      },
      { property: "og:title", content: "Mission Control Demo — The Mystery Vault" },
      {
        property: "og:description",
        content: "A preview of mission management and live operations for The Mystery Vault.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MissionControl,
});

function MissionControl() {
  const [missionOpen, setMissionOpen] = useState(false);
  const [auctionOpen, setAuctionOpen] = useState(false);
  const [hintReleased, setHintReleased] = useState(false);
  const [logs, setLogs] = useState([
    "23:44:01 — TIER 3 HINT UNLOCKED",
    "23:43:20 — TEAM 14 BID 2,000 MP",
    "23:43:12 — TEAM 07 BID 1,500 MP",
    "23:41:02 — MISSION RELEASED",
  ]);
  const [announcement, setAnnouncement] = useState("");
  function log(message: string) {
    setLogs((previous) => [`DEMO — ${message}`, ...previous]);
  }
  return (
    <main className="min-h-screen bg-background text-foreground pt-24 pb-20">
      <div className="section-wrap !py-10">
        <div className="flex flex-wrap justify-between items-center gap-5 border-b pb-7">
          <Link
            to="/"
            className="mono-label text-gold flex items-center gap-2 hover:text-foreground"
          >
            <ArrowLeft size={15} /> BACK TO THE VAULT
          </Link>
          <span className="mono-label text-primary">
            <span className="status-pulse" /> SIMULATION · NO LIVE EVENT DATA
          </span>
        </div>
        <div className="section-head mt-14">
          <div>
            <p className="mono-label eyebrow">RESTRICTED AREA · PROTOTYPE</p>
            <h1 className="display-title section-title">
              MISSION
              <br />
              <span className="text-primary">CONTROL.</span>
            </h1>
          </div>
          <p className="section-intro">
            A functional demonstration of the organizer console. All actions change this browser
            view only and are not saved or broadcast.
          </p>
        </div>
        <div className="control-grid">
          <div className="control-main">
            <p className="mono-label text-gold">
              <ShieldCheck size={15} className="inline mr-2" /> LIVE EVENT STATUS · DEMO
            </p>
            <h2 className="font-display font-extrabold uppercase text-5xl mt-8">SECURITY BREACH</h2>
            <div className="control-metrics">
              <div className="control-metric">
                <span className="mono-label text-muted-foreground">MISSION</span>
                <strong className={missionOpen ? "text-primary" : ""}>
                  {missionOpen ? "OPEN" : "LOCKED"}
                </strong>
              </div>
              <div className="control-metric">
                <span className="mono-label text-muted-foreground">CREWS</span>
                <strong>32</strong>
              </div>
              <div className="control-metric">
                <span className="mono-label text-muted-foreground">ACTIVE DEMO</span>
                <strong>31</strong>
              </div>
            </div>
            <p className="mono-label text-muted-foreground mt-8">
              AUCTION: <span className="text-gold">{auctionOpen ? "OPEN" : "CLOSED"}</span> &nbsp; ·
              &nbsp; HINT: <span className="text-gold">{hintReleased ? "RELEASED" : "LOCKED"}</span>
            </p>
          </div>
          <div className="control-side">
            <p className="mono-label text-primary">
              <Radio size={15} className="inline mr-2" /> COMMAND CHANNEL
            </p>
            <div className="grid grid-cols-2 gap-2 mt-8">
              {[
                [
                  missionOpen ? "CLOSE MISSION" : "OPEN MISSION",
                  () => {
                    setMissionOpen(!missionOpen);
                    log(missionOpen ? "MISSION CLOSED" : "MISSION OPENED");
                  },
                ],
                [
                  auctionOpen ? "END AUCTION" : "START AUCTION",
                  () => {
                    setAuctionOpen(!auctionOpen);
                    log(auctionOpen ? "AUCTION ENDED" : "AUCTION STARTED");
                  },
                ],
                [
                  "RELEASE HINT",
                  () => {
                    setHintReleased(true);
                    log("HINT RELEASED");
                  },
                ],
              ].map(([label, action]) => (
                <Button
                  key={label as string}
                  variant="heistOutline"
                  className="!whitespace-normal min-h-12 text-xs"
                  onClick={action as () => void}
                >
                  {label as string}
                </Button>
              ))}
            </div>
            <label className="mono-label text-muted-foreground block mt-8" htmlFor="announcement">
              BROADCAST ANNOUNCEMENT
            </label>
            <input
              id="announcement"
              className="auction-amount"
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              placeholder="Enter demo announcement"
              maxLength={140}
            />
            <Button
              variant="heist"
              className="w-full"
              onClick={() => {
                if (announcement.trim()) {
                  log(`ANNOUNCEMENT: ${announcement.trim()}`);
                  setAnnouncement("");
                }
              }}
            >
              BROADCAST (DEMO)
            </Button>
          </div>
        </div>
        <div className="mt-12 border-t pt-8">
          <h2 className="font-display font-bold text-4xl uppercase">ACTIVITY LOG</h2>
          <div className="terminal mt-5" aria-live="polite">
            {logs.map((entry, i) => (
              <div key={`${entry}-${i}`}>&gt; {entry}</div>
            ))}
          </div>
        </div>
        <p className="mono-label text-muted-foreground mt-12">
          ALL DATA ON THIS SCREEN IS ILLUSTRATIVE. NO TEAMS, BIDS, MISSIONS OR ANNOUNCEMENTS ARE
          CONNECTED TO A LIVE SERVICE.
        </p>
      </div>
    </main>
  );
}
