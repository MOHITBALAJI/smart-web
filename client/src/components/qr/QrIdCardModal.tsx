import React, { useState } from "react";
import { QrCode, Shield, Sparkles, User, Phone, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { QrGenerator } from "./QrGenerator";

interface QrIdCardModalProps {
  defaultName?: string;
  defaultPhone?: string;
  defaultCamp?: string;
  triggerButton?: React.ReactNode;
}

export function QrIdCardModal({
  defaultName = "",
  defaultPhone = "",
  defaultCamp = "Central Relief Camp #1",
  triggerButton,
}: QrIdCardModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(defaultName);
  const [phone, setPhone] = useState(defaultPhone);
  const [bloodGroup, setBloodGroup] = useState("O+");
  const [familyMembers, setFamilyMembers] = useState("1");
  const [camp, setCamp] = useState(defaultCamp);
  const [qrId, setQrId] = useState(() => `FR-VIC-${Math.floor(100000 + Math.random() * 900000)}`);
  const [copied, setCopied] = useState(false);

  const generateNewId = () => {
    const newId = `FR-VIC-${Math.floor(100000 + Math.random() * 900000)}`;
    setQrId(newId);
  };

  const qrDataPayload = JSON.stringify({
    id: qrId,
    name: name || "Anonymous Beneficiary",
    phone: phone || "N/A",
    bloodGroup,
    family: familyMembers,
    camp,
    timestamp: new Date().toISOString(),
    org: "FloodResponse EMS",
  });

  const handleCopyId = () => {
    navigator.clipboard.writeText(qrId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button className="gradient-hero text-white gap-2 shadow-lg hover:opacity-90">
            <QrCode className="w-4 h-4" />
            Generate Digital QR ID
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center text-white">
              <Shield className="w-4 h-4" />
            </div>
            Digital Relief QR ID Card Generator
          </DialogTitle>
          <DialogDescription>
            Generate a unique QR code ID for disaster relief aid, food distribution, and shelter check-in.
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 pt-2">
          {/* Left: Input Form */}
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-muted/60 p-3 rounded-xl border border-border">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Unique QR ID</span>
                <p className="font-mono text-sm font-bold text-primary">{qrId}</p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={handleCopyId} className="h-7 px-2 text-xs">
                  {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
                <Button size="sm" variant="outline" onClick={generateNewId} className="h-7 text-xs gap-1">
                  <Sparkles className="w-3 h-3" /> New
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="e.g. Rajan Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Emergency Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="+91 98765..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-9 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Blood Group</Label>
                <Select value={bloodGroup} onValueChange={setBloodGroup}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                      <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Family Size</Label>
                <Select value={familyMembers} onValueChange={setFamilyMembers}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <SelectItem key={num} value={String(num)}>
                        {num} {num === 1 ? "Person" : "People"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Assigned Camp</Label>
                <Input
                  placeholder="Relief Camp Name"
                  value={camp}
                  onChange={(e) => setCamp(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>

            <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-600" /> Digital Relief Verification
              </p>
              <p className="text-blue-800 text-[11px]">
                This QR ID prevents duplicate ration distributions and helps camp officers verify family quotas instantly.
              </p>
            </div>
          </div>

          {/* Right: Live QR Preview Card */}
          <div className="flex flex-col items-center justify-center bg-muted/40 rounded-2xl p-4 border border-border">
            <QrGenerator
              data={qrDataPayload}
              beneficiaryId={qrId}
              beneficiaryName={name || "Beneficiary Holder"}
              campName={camp}
              size={180}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
