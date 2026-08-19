import { useState, useEffect, useMemo } from "react";
import { Plus, ArrowRightLeft, Minus, Trash2, Search, X, Snowflake, Archive, Sun, ChevronDown } from "lucide-react";

const LOCATIONS = [
  { id: "fridge", label: "Fridge", icon: Snowflake, defaultShelfLife: 7 },
  { id: "freezer", label: "Freezer", icon: Snowflake, defaultShelfLife: 90 },
  { id: "pantry", label: "Pantry", icon: Archive, defaultShelfLife: 60 },
  { id: "counter", label: "Counter / Outside", icon: Sun, defaultShelfLife: 5 },
];

const uid = () => Math.random().toString(36).slice(2, 10);
const todayISO = () => new Date().toISOString().slice(0, 10);
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

function freshness(form) {
  const age = daysBetween(form.addedDate, todayISO());
  const life = form.shelfLifeDays || 7;
  const pct = Math.max(0, Math.min(1, 1 - age / life));
  return { pct, daysLeft: life - age };
}

function freshColor(pct) {
  if (pct > 0.5) return { bar: "#3F7D5C", text: "#2C5A42", bg: "#E7F1EA" };
  if (pct > 0.2) return { bar: "#C98A2C", text: "#8C5E17", bg: "#F6ECD9" };
  return { bar: "#B4472B", text: "#8A331E", bg: "#F5E2DC" };
}

const SEED = [
  {
    id: uid(),
    name: "Watermelon",
    category: "Produce",
    forms: [
      { id: uid(), unit: "whole", qty: 1, note: "", location: "counter", addedDate: todayISO(), shelfLifeDays: 6 },
    ],
  },
  {
    id: uid(),
    name: "Garlic",
    category: "Produce",
    forms: [
      { id: uid(), unit: "bulbs", qty: 3, note: "", location: "pantry", addedDate: todayISO(), shelfLifeDays: 45 },
    ],
  },
];

export default function PantryTracker() {
  const [items, setItems] = useState(null);
  const [query, setQuery] = useState("");
  const [activeLoc, setActiveLoc] = useState("all");
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [convertFor, setConvertFor] = useState(null); // { itemId, formId }
  const [stockFor, setStockFor] = useState(null); // itemId

  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get("pantry-items");
        setItems(r ? JSON.parse(r.value) : SEED);
      } catch {
        setItems(SEED);
      }
    })();
  }, []);

  useEffect(() => {
    if (items === null) return;
    window.storage.set("pantry-items", JSON.stringify(items)).catch(() => {});
  }, [items]);

  const filtered = useMemo(() => {
    if (items === null) return [];
    return items
      .map((it) => ({
        ...it,
        forms: it.forms.filter((f) => activeLoc === "all" || f.location === activeLoc),
      }))
      .filter((it) => it.forms.length > 0)
      .filter((it) => it.name.toLowerCase().includes(query.toLowerCase()));
  }, [items, query, activeLoc]);

  const updateItems = (fn) => setItems((prev) => fn(structuredClone(prev)));

  const consumeForm = (itemId, formId, delta) => {
    updateItems((draft) => {
      const item = draft.find((i) => i.id === itemId);
      const form = item.forms.find((f) => f.id === formId);
      form.qty = Math.max(0, +(form.qty + delta).toFixed(2));
      if (form.qty === 0) item.forms = item.forms.filter((f) => f.id !== formId);
      if (item.forms.length === 0) return draft.filter((i) => i.id !== itemId);
      return draft;
    });
  };

  const deleteForm = (itemId, formId) => {
    updateItems((draft) => {
      const item = draft.find((i) => i.id === itemId);
      item.forms = item.forms.filter((f) => f.id !== formId);
      if (item.forms.length === 0) return draft.filter((i) => i.id !== itemId);
      return draft;
    });
  };

  const addItem = ({ name, category, unit, qty, location, shelfLifeDays, note }) => {
    updateItems((draft) => {
      const existing = draft.find((i) => i.name.toLowerCase() === name.toLowerCase());
      const newForm = { id: uid(), unit, qty: +qty, note, location, addedDate: todayISO(), shelfLifeDays: +shelfLifeDays };
      if (existing) {
        existing.forms.push(newForm);
      } else {
        draft.push({ id: uid(), name, category, forms: [newForm] });
      }
      return draft;
    });
    setAddItemOpen(false);
    setStockFor(null);
  };

  const convertForm = (itemId, formId, outputs) => {
    updateItems((draft) => {
      const item = draft.find((i) => i.id === itemId);
      item.forms = item.forms.filter((f) => f.id !== formId);
      outputs.forEach((o) =>
        item.forms.push({
          id: uid(),
          unit: o.unit,
          qty: +o.qty,
          note: o.note,
          location: o.location,
          addedDate: todayISO(),
          shelfLifeDays: +o.shelfLifeDays,
        })
      );
      return draft;
    });
    setConvertFor(null);
  };

  if (items === null) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-stone-400">Loading pantry…</div>;
  }

  const convertItem = convertFor && items.find((i) => i.id === convertFor.itemId);
  const convertFormObj = convertItem && convertItem.forms.find((f) => f.id === convertFor.formId);
  const stockItem = stockFor && items.find((i) => i.id === stockFor);

  return (
    <div className="min-h-screen" style={{ background: "#EEF3EC", fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap');
      `}</style>

      <header className="sticky top-0 z-10 backdrop-blur px-4 pt-5 pb-3" style={{ background: "rgba(238,243,236,0.92)" }}>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, color: "#1F3A2E" }} className="text-2xl tracking-tight">
          Larder
        </h1>
        <p className="text-xs mt-0.5" style={{ color: "#5E7566" }}>What's fresh, what's not, what's missing.</p>

        <div className="mt-3 flex items-center gap-2 bg-white rounded-xl px-3 py-2 border" style={{ borderColor: "#D7E2D3" }}>
          <Search size={16} color="#8AA093" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Do I have garlic?"
            className="flex-1 text-sm outline-none bg-transparent"
            style={{ color: "#1F3A2E" }}
          />
        </div>

        <div className="mt-3 flex gap-1.5 overflow-x-auto no-scrollbar">
          <Chip active={activeLoc === "all"} onClick={() => setActiveLoc("all")} label="All" />
          {LOCATIONS.map((l) => (
            <Chip key={l.id} active={activeLoc === l.id} onClick={() => setActiveLoc(l.id)} label={l.label} Icon={l.icon} />
          ))}
        </div>
      </header>

      <main className="px-4 pb-28 pt-2 space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-sm" style={{ color: "#8AA093" }}>
            Nothing here. Add something below.
          </div>
        )}
        {filtered.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl border p-4" style={{ borderColor: "#DCE6D8" }}>
            <div className="flex items-baseline justify-between mb-2">
              <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, color: "#1F3A2E" }} className="text-lg">
                {item.name}
              </h3>
              <button
                onClick={() => setStockFor(item.id)}
                className="text-xs font-medium px-2 py-1 rounded-lg"
                style={{ color: "#1F4B4A", background: "#E4EFEA" }}
              >
                + Add stock
              </button>
            </div>

            <div className="space-y-2.5">
              {item.forms.map((form) => {
                const { pct, daysLeft } = freshness(form);
                const c = freshColor(pct);
                return (
                  <div key={form.id} className="rounded-xl p-3" style={{ background: c.bg }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium" style={{ fontFamily: "'IBM Plex Mono', monospace", color: c.text }}>
                          {form.qty} {form.unit}
                        </span>
                        {form.note && <span className="text-xs ml-1.5" style={{ color: c.text }}>· {form.note}</span>}
                        <div className="text-[11px] mt-0.5" style={{ color: c.text, opacity: 0.85 }}>
                          {LOCATIONS.find((l) => l.id === form.location)?.label} · {daysLeft > 0 ? `${daysLeft}d left` : "past estimate"}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <IconBtn onClick={() => consumeForm(item.id, form.id, -1)} title="Use one"><Minus size={14} /></IconBtn>
                        <IconBtn onClick={() => setConvertFor({ itemId: item.id, formId: form.id })} title="Convert / repackage"><ArrowRightLeft size={14} /></IconBtn>
                        <IconBtn onClick={() => deleteForm(item.id, form.id)} title="Remove"><Trash2 size={14} /></IconBtn>
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.08)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct * 100}%`, background: c.bar }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </main>

      <button
        onClick={() => setAddItemOpen(true)}
        className="fixed bottom-6 right-5 rounded-full w-14 h-14 flex items-center justify-center shadow-lg"
        style={{ background: "#1F4B4A" }}
      >
        <Plus color="white" size={24} />
      </button>

      {addItemOpen && <AddItemSheet onClose={() => setAddItemOpen(false)} onSubmit={addItem} />}
      {stockItem && (
        <AddItemSheet
          existingName={stockItem.name}
          existingCategory={stockItem.category}
          onClose={() => setStockFor(null)}
          onSubmit={addItem}
        />
      )}
      {convertFormObj && (
        <ConvertSheet
          itemName={convertItem.name}
          form={convertFormObj}
          onClose={() => setConvertFor(null)}
          onSubmit={(outputs) => convertForm(convertFor.itemId, convertFor.formId, outputs)}
        />
      )}
    </div>
  );
}

function Chip({ active, onClick, label, Icon }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors"
      style={
        active
          ? { background: "#1F4B4A", color: "white", borderColor: "#1F4B4A" }
          : { background: "white", color: "#4C6157", borderColor: "#DCE6D8" }
      }
    >
      {Icon && <Icon size={12} />}
      {label}
    </button>
  );
}

function IconBtn({ children, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-7 h-7 rounded-full flex items-center justify-center bg-white/70 hover:bg-white"
      style={{ color: "#3A4B41" }}
    >
      {children}
    </button>
  );
}

function Sheet({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-3xl p-5 pb-8 max-h-[85vh] overflow-y-auto" style={{ boxShadow: "0 -8px 30px rgba(0,0,0,0.15)" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, color: "#1F3A2E" }} className="text-lg">{title}</h2>
          <button onClick={onClose}><X size={20} color="#8AA093" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <div className="text-xs font-medium mb-1" style={{ color: "#5E7566" }}>{label}</div>
      {children}
    </label>
  );
}

const inputCls = "w-full text-sm rounded-lg border px-3 py-2 outline-none";
const inputStyle = { borderColor: "#DCE6D8", color: "#1F3A2E" };

function AddItemSheet({ onClose, onSubmit, existingName, existingCategory }) {
  const [name, setName] = useState(existingName || "");
  const [category, setCategory] = useState(existingCategory || "Produce");
  const [unit, setUnit] = useState("");
  const [qty, setQty] = useState("1");
  const [location, setLocation] = useState("fridge");
  const [shelfLifeDays, setShelfLifeDays] = useState(String(LOCATIONS.find((l) => l.id === "fridge").defaultShelfLife));
  const [note, setNote] = useState("");

  return (
    <Sheet title={existingName ? `Add stock · ${existingName}` : "Add item"} onClose={onClose}>
      <Field label="Item name">
        <input className={inputCls} style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} disabled={!!existingName} placeholder="e.g. Watermelon" />
      </Field>
      {!existingName && (
        <Field label="Category">
          <input className={inputCls} style={inputStyle} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Produce, Dairy, Grain…" />
        </Field>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Quantity">
          <input className={inputCls} style={inputStyle} type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
        </Field>
        <Field label="Unit (your words)">
          <input className={inputCls} style={inputStyle} value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="whole, bulbs, jar…" />
        </Field>
      </div>
      <Field label="Note (optional)">
        <input className={inputCls} style={inputStyle} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. 500ml container" />
      </Field>
      <Field label="Where">
        <div className="flex gap-2 flex-wrap">
          {LOCATIONS.map((l) => (
            <button
              key={l.id}
              onClick={() => {
                setLocation(l.id);
                setShelfLifeDays(String(l.defaultShelfLife));
              }}
              className="text-xs px-3 py-1.5 rounded-full border"
              style={location === l.id ? { background: "#1F4B4A", color: "white", borderColor: "#1F4B4A" } : { borderColor: "#DCE6D8", color: "#4C6157" }}
            >
              {l.label}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Estimated days fresh">
        <input className={inputCls} style={inputStyle} type="number" value={shelfLifeDays} onChange={(e) => setShelfLifeDays(e.target.value)} />
      </Field>
      <button
        disabled={!name || !unit}
        onClick={() => onSubmit({ name, category, unit, qty, location, shelfLifeDays, note })}
        className="w-full mt-2 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40"
        style={{ background: "#1F4B4A" }}
      >
        Save
      </button>
    </Sheet>
  );
}

function ConvertSheet({ itemName, form, onClose, onSubmit }) {
  const [outputs, setOutputs] = useState([
    { unit: "", qty: "1", note: "", location: form.location, shelfLifeDays: String(form.shelfLifeDays) },
  ]);

  const update = (i, key, val) => setOutputs((o) => o.map((x, idx) => (idx === i ? { ...x, [key]: val } : x)));
  const addRow = () => setOutputs((o) => [...o, { unit: "", qty: "1", note: "", location: form.location, shelfLifeDays: String(form.shelfLifeDays) }]);
  const removeRow = (i) => setOutputs((o) => o.filter((_, idx) => idx !== i));

  const valid = outputs.every((o) => o.unit && o.qty);

  return (
    <Sheet title={`Convert ${form.qty} ${form.unit} ${itemName}`} onClose={onClose}>
      <p className="text-xs mb-4" style={{ color: "#8AA093" }}>
        Turn this into one or more new forms. The original will be replaced.
      </p>
      <div className="space-y-4">
        {outputs.map((o, i) => (
          <div key={i} className="rounded-xl border p-3" style={{ borderColor: "#DCE6D8" }}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium" style={{ color: "#5E7566" }}>Result {i + 1}</span>
              {outputs.length > 1 && (
                <button onClick={() => removeRow(i)}><X size={14} color="#B4472B" /></button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input className={inputCls} style={inputStyle} type="number" placeholder="Qty" value={o.qty} onChange={(e) => update(i, "qty", e.target.value)} />
              <input className={inputCls} style={inputStyle} placeholder="Unit e.g. containers" value={o.unit} onChange={(e) => update(i, "unit", e.target.value)} />
            </div>
            <input className={inputCls} style={inputStyle + { marginBottom: 8 }} placeholder="Note e.g. 500ml size" value={o.note} onChange={(e) => update(i, "note", e.target.value)} />
            <div className="flex gap-2 flex-wrap mb-2">
              {LOCATIONS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => update(i, "location", l.id)}
                  className="text-xs px-2.5 py-1 rounded-full border"
                  style={o.location === l.id ? { background: "#1F4B4A", color: "white", borderColor: "#1F4B4A" } : { borderColor: "#DCE6D8", color: "#4C6157" }}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <input className={inputCls} style={inputStyle} type="number" placeholder="Days fresh" value={o.shelfLifeDays} onChange={(e) => update(i, "shelfLifeDays", e.target.value)} />
          </div>
        ))}
      </div>
      <button onClick={addRow} className="text-xs font-medium mt-3 px-3 py-1.5 rounded-lg" style={{ color: "#1F4B4A", background: "#E4EFEA" }}>
        + Add another result
      </button>
      <button
        disabled={!valid}
        onClick={() => onSubmit(outputs)}
        className="w-full mt-4 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40"
        style={{ background: "#1F4B4A" }}
      >
        Convert
      </button>
    </Sheet>
  );
}
