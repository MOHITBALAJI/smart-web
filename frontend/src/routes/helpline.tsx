import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  Phone,
  Shield,
  Clock,
  MapPin,
  AlertTriangle,
  ArrowLeft,
  LifeBuoy,
  HeartPulse,
  Flame,
  UserCheck,
  Compass
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/helpline")({
  component: HelplinePage,
});

const HELPLINES = [
  {
    number: "112",
    label: "National Emergency Number",
    desc: "Single emergency helpline for all immediate search, rescue, and police support services.",
    icon: Shield,
    color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  },
  {
    number: "1070",
    label: "State Disaster Helpline",
    desc: "State Emergency Operation Centre (SEOC) for macro-level disaster alerts and rescue resources.",
    icon: Compass,
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  {
    number: "1077",
    label: "District Disaster Control",
    desc: "Direct connection to local District Collectorate dispatch control room for rescue boat tasks.",
    icon: MapPin,
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  {
    number: "108",
    label: "Emergency Ambulance",
    desc: "Direct emergency line for critical casualty evacuation and immediate hospital transport.",
    icon: HeartPulse,
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  },
  {
    number: "104",
    label: "Medical Advice & Health Info",
    desc: "Speak to doctors for post-flood hygiene advice, epidemic prevention, and first aid instructions.",
    icon: LifeBuoy,
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  {
    number: "101",
    label: "Fire and Rescue Operations",
    desc: "Fire service units for high-voltage power-cut assistance and water logging evacuations.",
    icon: Flame,
    color: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  },
];

function HelplinePage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <button
            onClick={() => router.history.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs font-bold font-outfit">Go Back</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center text-white">
              <Phone className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm font-outfit">Helpline Directory</span>
          </div>
        </div>
      </header>

      {/* BODY */}
      <main className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <div className="text-center space-y-3">
          <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-0 font-bold px-3 py-0.5">Emergency Directory</Badge>
          <h1 className="text-3xl md:text-4xl font-black font-outfit">Flood Disaster Helpline Numbers</h1>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Direct cellular dialing for national and state-level control centers. Tapping any hotline instantly opens your phone call dialer.
          </p>
        </div>

        {/* Advisory Card */}
        <Card className="border-red-500/20 bg-red-500/5 dark:bg-red-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-red-800 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              Critical Safety Notice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed font-semibold">
              Always keep a copy of these helpline numbers written down offline. During flood emergencies, cellular data networks may experience downtime, but basic GSM voice calling channels (dialing 112) usually remain operational.
            </p>
          </CardContent>
        </Card>

        {/* Directory Grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          {HELPLINES.map((item) => (
            <Card key={item.number} className="border border-border/80 bg-card/60 backdrop-blur-sm flex flex-col justify-between hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3 flex flex-row items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center shrink-0`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <CardTitle className="text-sm font-bold text-foreground">{item.label}</CardTitle>
                  </div>
                  <CardDescription className="text-xs leading-relaxed mt-2 text-muted-foreground">
                    {item.desc}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <a href={`tel:${item.number}`} className="block">
                  <Button className="w-full bg-primary hover:bg-primary/95 text-white font-bold text-xs gap-2 py-2.5 shadow">
                    <Phone className="w-4 h-4 animate-pulse" />
                    Call Hotline: {item.number}
                  </Button>
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
