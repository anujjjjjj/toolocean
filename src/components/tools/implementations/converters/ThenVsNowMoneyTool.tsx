import { useEffect, useRef, useState } from "react";
import { Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import data from "@/data/cpiThenVsNow.json";
import { calculatePurchasingPower } from "@/lib/thenVsNow";

type Currency = "INR" | "USD";
const years = Array.from({ length: 36 }, (_, i) => String(1990 + i));

export function ThenVsNowMoneyTool() {
  const [amount, setAmount] = useState("1000");
  const [currency, setCurrency] = useState<Currency>("INR");
  const [year, setYear] = useState("1995");
  const [message, setMessage] = useState("");
  const [display, setDisplay] = useState(0);
  const current = useRef(0);
  // Read after hydration so shared links keep the prerendered shell consistent.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const a = params.get("amount");
    if (a !== null) setAmount(a);
    const c = params.get("cur");
    if (c === "INR" || c === "USD") setCurrency(c);
    const y = params.get("year");
    if (y && years.includes(y)) setYear(y);
  }, []);
  const series = data[currency];
  const result = amount.trim() ? calculatePurchasingPower(Number(amount), Number(year), series.annual, series.latest) : null;
  const target = result?.equivalent ?? 0;
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const finish = () => { cancelAnimationFrame(frame); current.current = target; setDisplay(target); };
    const start = performance.now();
    const from = current.current;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / 650, 1);
      current.current = from + (target - from) * (1 - Math.pow(1 - progress, 3));
      setDisplay(current.current);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    const onPreference = () => { if (preference.matches) finish(); };
    if (preference.matches) finish(); else frame = requestAnimationFrame(tick);
    preference.addEventListener("change", onPreference);
    return () => { cancelAnimationFrame(frame); preference.removeEventListener("change", onPreference); };
  }, [target]);
  useEffect(() => { setMessage(""); }, [amount, currency, year]);

  const money = (value: number) => new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
  const note = currency === "USD"
    ? `2026 YTD estimate, not final. ${series.latest.note}`
    : `Results are in 2025 rupees, latest official. ${series.latest.note}`;
  const sentence = result ? `What ${money(Number(amount))} bought in ${year} costs ${money(result.equivalent)} today` : "";
  const rate = result?.annualInflation == null ? "N/A (same year)" : `${result.annualInflation.toFixed(2)}%`;

  const copyLink = async () => {
    if (!result) return;
    const url = new URL(window.location.href);
    url.search = new URLSearchParams({ amount: String(Number(amount)), cur: currency, year }).toString();
    url.hash = "";
    try { await navigator.clipboard.writeText(url.toString()); setMessage("Result link copied."); }
    catch { setMessage("Copy failed. Please allow clipboard access and try again."); }
  };
  const download = async () => {
    if (!result) return;
    try {
      await document.fonts.ready;
      const canvas = document.createElement("canvas");
      canvas.width = 1200; canvas.height = 840;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");
      const styles = getComputedStyle(document.documentElement);
      const color = (token: string) => `hsl(${styles.getPropertyValue(token).trim()})`;
      ctx.fillStyle = color("--background"); ctx.fillRect(0, 0, 1200, 840);
      ctx.fillStyle = color("--foreground");
      let y = 72;
      const line = (text: string, font: string, gap = 42) => {
        ctx.font = font;
        let row = "";
        for (const word of text.split(" ")) {
          const next = row ? `${row} ${word}` : word;
          if (ctx.measureText(next).width > 1080 && row) { ctx.fillText(row, 60, y); y += gap; row = word; } else row = next;
        }
        ctx.fillText(row, 60, y); y += gap;
      };
      line("ToolOcean / Then vs Now Money Machine", '600 32px "Instrument Sans", sans-serif', 68);
      const value = money(result.equivalent);
      let size = 76;
      do { ctx.font = `500 ${size}px "Geist Mono", monospace`; if (ctx.measureText(value).width <= 1080) break; size -= 2; } while (size > 14);
      line(value, ctx.font, 74);
      line(sentence, '400 30px "Instrument Sans", sans-serif');
      line(`Prices are ${result.multiplier.toFixed(1)}x higher · Avg annual inflation: ${rate}`, '400 26px "Geist Mono", monospace', 58);
      line(note, '400 23px "Instrument Sans", sans-serif', 34);
      y += 12;
      line(series.series, '400 22px "Instrument Sans", sans-serif', 32);
      line(series.source, '400 22px "Instrument Sans", sans-serif', 32);
      line(series.sourceUrl, '400 20px "Instrument Sans", sans-serif', 32);
      y += 12;
      line("toolocean.co/what-was-it-worth", '500 24px "Geist Mono", monospace');
      canvas.toBlob((blob) => {
        if (!blob) { setMessage("PNG could not be created. Please try again."); return; }
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a"); link.href = url; link.download = `then-vs-now-${currency}-${year}.png`;
        link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
        setMessage("PNG downloaded.");
      }, "image/png");
    } catch { setMessage("PNG could not be created. Please try again."); }
  };

  return <div className="space-y-5">
    <Card>
      <CardHeader><CardTitle>Send your money through time</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-3">
          <div className="space-y-2"><Label htmlFor="then-amount">Amount back then</Label><Input id="then-amount" type="number" inputMode="decimal" min="0" step="any" value={amount} onChange={e => setAmount(e.target.value)} className="font-mono" aria-invalid={!result} aria-describedby={!result ? "money-error" : undefined} /></div>
          <div className="space-y-2"><Label id="currency-label">Currency</Label><ToggleGroup type="single" variant="outline" value={currency} onValueChange={v => { if (v === "INR" || v === "USD") setCurrency(v); }} aria-labelledby="currency-label" className="justify-start"><ToggleGroupItem value="INR" className="flex-1">₹ INR</ToggleGroupItem><ToggleGroupItem value="USD" className="flex-1">$ USD</ToggleGroupItem></ToggleGroup></div>
          <div className="space-y-2"><Label htmlFor="then-year">Starting year</Label><Select value={year} onValueChange={setYear}><SelectTrigger id="then-year" className="font-mono"><SelectValue /></SelectTrigger><SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select></div>
        </div>
        {!result && <p id="money-error" role="alert" className="text-sm text-destructive">Enter a finite, nonnegative amount small enough to calculate.</p>}
      </CardContent>
    </Card>
    {result && <Card className="bg-muted/30">
      <CardContent className="space-y-5 pt-6 sm:p-8">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Equivalent purchasing power · {series.latest.year} {currency}</p>
        <p aria-hidden="true" className="break-all font-mono text-3xl font-medium tracking-tight sm:text-5xl">{money(display)}</p>
        <p className="text-lg" aria-live="polite">{sentence}</p>
        <p className="text-sm font-medium">{note}</p>
        <div className="grid gap-4 border-y py-4 sm:grid-cols-2">
          <div><p className="font-mono text-xl">Prices are {result.multiplier.toFixed(1)}x higher</p><p className="text-sm text-muted-foreground">CPI price-level multiplier</p></div>
          <div><p className="font-mono text-xl">{rate}</p><p className="text-sm text-muted-foreground">Average annual inflation (compound rate)</p></div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row"><Button onClick={download}><Download className="mr-2 h-4 w-4" />Download PNG</Button><Button variant="outline" onClick={copyLink}><Copy className="mr-2 h-4 w-4" />Copy link</Button></div>
        <p className="text-xs text-muted-foreground">Shared links include your amount, currency, and year. “Today” uses the dataset endpoint above.</p>
      </CardContent>
    </Card>}
    <p role="status" className="text-sm">{message}</p>
    <Card><CardHeader><CardTitle>Data & method</CardTitle></CardHeader><CardContent className="space-y-4 text-sm">
      <p className="font-mono">Equivalent = amount × latest CPI ÷ starting-year CPI</p>
      <p>This compares a broad consumer basket. Individual prices and your personal spending can change differently. It measures purchasing power within a currency, without exchange-rate conversion.</p>
      {(["INR", "USD"] as const).map(c => <div key={c} className="space-y-1"><p className="font-medium">{c}: {data[c].series}</p><a className="text-muted-foreground underline underline-offset-4" href={data[c].sourceUrl} target="_blank" rel="noreferrer">{data[c].source}</a><p>{data[c].latest.note}</p></div>)}
    </CardContent></Card>
  </div>;
}
