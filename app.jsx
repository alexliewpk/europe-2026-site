const { useEffect, useMemo, useRef, useState } = React;

const STORAGE_KEY = "travel-itinerary-v2";
const SUPABASE_TABLE = "trip_itineraries";
const SUPABASE_ROW_ID = "europe-2026";
const SUPABASE_URL = "https://xukgdrnqkwuxsmaqwvta.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_i_QWouaGp43S5jsC0_3UXA_1TyXSMly";

const sessionTypes = [
  { id: "morning", label: "Morning" },
  { id: "evening", label: "Evening" },
  { id: "night", label: "Night" }
];

const defaultColumns = [
  { id: "date", label: "Date", type: "text" },
  { id: "place", label: "Place", type: "text" },
  { id: "transport", label: "Transport", type: "text" },
  { id: "distance", label: "Distance", type: "text" },
  { id: "cost", label: "Cost", type: "text" },
  { id: "notes", label: "Notes", type: "textarea" }
];

const sampleItems = [
  {
    id: "sample-1",
    date: "25 May",
    place: "Budapest",
    sessions: {
      morning: { time: "", plan: "" },
      evening: { time: "19:35", plan: "Arrive at Budapest airport, transfer to Sipsix Apt, rest." },
      night: { time: "", plan: "Settle in and keep the night easy." }
    },
    transport: "Airport to hotel, about 40 mins, 30 Euro",
    distance: "",
    cost: "30 Euro",
    notes: "Check in and keep the evening light."
  },
  {
    id: "sample-2",
    date: "26 May",
    place: "Budapest",
    sessions: {
      morning: { time: "8:00", plan: "Fisherman's Bastion, Matthias Church, and Buda Castle area." },
      evening: { time: "15:00", plan: "Museum walk, Chain Bridge, and rose ice cream." },
      night: { time: "20:00", plan: "Danube night cruise and riverside views." }
    },
    transport: "Hotel to Fisherman's Bastion by Bolt, about 20 mins",
    distance: "",
    cost: "6-10 Euro",
    notes: "Avoid the biggest crowd by starting early."
  },
  {
    id: "sample-3",
    date: "27 May",
    place: "Budapest",
    sessions: {
      morning: { time: "9:00", plan: "Hungarian Parliament and St. Stephen's Basilica." },
      evening: { time: "15:00", plan: "New York Cafe and Central Market Hall." },
      night: { time: "19:00", plan: "Sunset at Liberty Bridge and dinner nearby." }
    },
    transport: "Walk and local ride",
    distance: "",
    cost: "",
    notes: "Book Parliament visit ahead if possible."
  },
  {
    id: "sample-4",
    date: "28 May",
    place: "Budapest to Vienna",
    sessions: {
      morning: { time: "09:55", plan: "Depart Budapest by train." },
      evening: { time: "12:20", plan: "Arrive in Vienna and explore the city area." },
      night: { time: "", plan: "Check in at Vienna central apartment." }
    },
    transport: "Train",
    distance: "",
    cost: "12 Euro Bolt to station",
    notes: "Stay at Vienna central apartment."
  },
  {
    id: "sample-5",
    date: "29 May",
    place: "Vienna to Hallstatt",
    sessions: {
      morning: { time: "06:28", plan: "Train from Vienna to Hallstatt." },
      evening: { time: "10:20", plan: "Ferry to town and explore Hallstatt." },
      night: { time: "19:30", plan: "Return to Vienna and dinner after arrival." }
    },
    transport: "Train and ferry",
    distance: "",
    cost: "",
    notes: "Bring layers and water."
  },
  {
    id: "sample-6",
    date: "30 May",
    place: "Vienna to Prague",
    sessions: {
      morning: { time: "10:10", plan: "Depart Vienna by train." },
      evening: { time: "14:15", plan: "Arrive in Prague and walk Old Town." },
      night: { time: "", plan: "Stay at Historic Centre Apt 4." }
    },
    transport: "Train",
    distance: "",
    cost: "",
    notes: "Stay at Historic Centre Apt 4."
  },
  {
    id: "sample-7",
    date: "31 May",
    place: "Prague",
    sessions: {
      morning: { time: "8:00", plan: "Start early at Charles Bridge." },
      evening: { time: "14:00", plan: "Visit Prague Castle." },
      night: { time: "", plan: "Free evening around the old streets." }
    },
    transport: "Walk / local transport",
    distance: "",
    cost: "",
    notes: "Start Charles Bridge early."
  },
  {
    id: "sample-8",
    date: "1 June",
    place: "Prague",
    sessions: {
      morning: { time: "9:00", plan: "Old Town walk." },
      evening: { time: "15:00", plan: "Astronomical Clock and nearby streets." },
      night: { time: "", plan: "Final full sightseeing night." }
    },
    transport: "Walk",
    distance: "",
    cost: "",
    notes: "Final full sightseeing day."
  },
  {
    id: "sample-9",
    date: "2 June",
    place: "Prague",
    sessions: {
      morning: { time: "09:15", plan: "Fly back to Kuala Lumpur." },
      evening: { time: "", plan: "" },
      night: { time: "", plan: "" }
    },
    transport: "Flight",
    distance: "",
    cost: "",
    notes: "Check airport transfer timing."
  }
];

function createEmptyItem(columns) {
  const item = columns.reduce(
    (item, column) => {
      item[column.id] = "";
      return item;
    },
    { id: crypto.randomUUID(), sessions: createEmptySessions() }
  );
  item.sessions = createEmptySessions();
  return item;
}

function createEmptySessions() {
  return sessionTypes.reduce((sessions, session) => {
    sessions[session.id] = { time: "", plan: "" };
    return sessions;
  }, {});
}

function normalizeItem(item) {
  return {
    ...item,
    sessions: {
      ...createEmptySessions(),
      ...(item.sessions || {})
    }
  };
}

function readSavedState() {
  const fallback = {
    tripName: "Europe Trip 2026",
    mode: "view",
    columns: defaultColumns,
    items: sampleItems
  };

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return fallback;
    return {
      ...fallback,
      ...saved,
      columns: Array.isArray(saved.columns) && saved.columns.length ? saved.columns : defaultColumns,
      items: Array.isArray(saved.items) ? saved.items.map(normalizeItem) : sampleItems
    };
  } catch {
    return fallback;
  }
}

function getSupabaseConfig() {
  const config = window.TRAVEL_CONFIG || {};
  return {
    url: config.supabaseUrl || SUPABASE_URL,
    anonKey: config.supabaseAnonKey || SUPABASE_ANON_KEY
  };
}

function createSupabaseClient() {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey || !window.supabase) return null;
  return window.supabase.createClient(config.url, config.anonKey);
}

function createSharedData(tripName, columns, items) {
  return {
    tripName,
    columns,
    items: items.map(normalizeItem)
  };
}

function normalizeSharedData(data) {
  return {
    tripName: data?.tripName || "Europe Trip 2026",
    columns: Array.isArray(data?.columns) && data.columns.length ? data.columns : defaultColumns,
    items: Array.isArray(data?.items) ? data.items.map(normalizeItem) : sampleItems
  };
}

function cleanColumnId(label) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `column-${Date.now()}`;
}

function csvValue(value) {
  return `"${String(value || "").replace(/"/g, '""')}"`;
}

function buildCsv(columns, items) {
  const customColumns = columns.filter((column) => !["date", "place", "transport", "distance", "cost", "notes"].includes(column.id));
  const headers = [
    "Date",
    "Place",
    "Morning Time",
    "Morning Plan",
    "Evening Time",
    "Evening Plan",
    "Night Time",
    "Night Plan",
    "Transport",
    "Distance",
    "Cost",
    "Notes",
    ...customColumns.map((column) => column.label)
  ];

  const rows = items.map((item) => {
    const sessions = { ...createEmptySessions(), ...(item.sessions || {}) };
    return [
      item.date,
      item.place,
      sessions.morning.time,
      sessions.morning.plan,
      sessions.evening.time,
      sessions.evening.plan,
      sessions.night.time,
      sessions.night.plan,
      item.transport,
      item.distance,
      item.cost,
      item.notes,
      ...customColumns.map((column) => item[column.id])
    ];
  });

  return [headers, ...rows].map((row) => row.map(csvValue).join(",")).join("\n");
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        value += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        value += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(value);
      value = "";
    } else if (char === "\n") {
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else if (char !== "\r") {
      value += char;
    }
  }

  row.push(value);
  rows.push(row);
  return rows.filter((entry) => entry.some((cell) => cell.trim()));
}

function App() {
  const savedState = readSavedState();
  const [tripName, setTripName] = useState(() => readSavedState().tripName);
  const [mode, setMode] = useState(() => readSavedState().mode);
  const [columns, setColumns] = useState(() => readSavedState().columns);
  const [items, setItems] = useState(() => readSavedState().items);
  const [editingItem, setEditingItem] = useState(null);
  const [columnName, setColumnName] = useState("");
  const [importMessage, setImportMessage] = useState("");
  const [sharedStatus, setSharedStatus] = useState("checking");
  const [sharedMessage, setSharedMessage] = useState("Checking shared online save...");
  const [sharedReady, setSharedReady] = useState(false);
  const [hasLoadedShared, setHasLoadedShared] = useState(false);
  const [lastRemoteUpdate, setLastRemoteUpdate] = useState("");
  const importInputRef = useRef(null);
  const skipNextSharedSaveRef = useRef(false);

  const isEditMode = mode === "edit";
  const cityCount = useMemo(() => new Set(items.map((item) => item.place).filter(Boolean)).size, [items]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ tripName, mode, columns, items }));
  }, [tripName, mode, columns, items]);

  async function syncFromOnline() {
    const client = createSupabaseClient();
    if (!client) {
      setSharedStatus("local");
      setSharedMessage("This device only. Add Supabase keys to share updates.");
      return;
    }

    setSharedStatus("syncing");
    setSharedMessage("Checking latest shared itinerary...");

    const { data, error } = await client
      .from(SUPABASE_TABLE)
      .select("data, updated_at")
      .eq("id", SUPABASE_ROW_ID)
      .maybeSingle();

    if (error) {
      setSharedStatus("error");
      setSharedMessage("Could not load the shared itinerary. Try Sync Now again.");
      return;
    }

    if (!data?.data) {
      setSharedStatus("shared");
      setSharedMessage("Shared online is ready. Save once to publish this itinerary.");
      return;
    }

    const shared = normalizeSharedData(data.data);
    skipNextSharedSaveRef.current = true;
    setTripName(shared.tripName);
    setColumns(shared.columns);
    setItems(shared.items);
    setLastRemoteUpdate(data.updated_at || "");
    setSharedStatus("shared");
    setSharedMessage("Loaded the latest shared itinerary.");
  }

  useEffect(() => {
    const client = createSupabaseClient();
    if (!client) {
      setSharedStatus("local");
      setSharedMessage("This device only. Add Supabase keys to share updates with your wife.");
      setHasLoadedShared(true);
      return;
    }

    let cancelled = false;

    async function loadSharedTrip() {
      setSharedStatus("syncing");
      setSharedMessage("Loading shared itinerary...");

      const { data, error } = await client
        .from(SUPABASE_TABLE)
        .select("data, updated_at")
        .eq("id", SUPABASE_ROW_ID)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        setSharedStatus("error");
        setSharedMessage("Supabase is not ready yet. Check the table setup and permissions.");
        setHasLoadedShared(true);
        return;
      }

      if (data?.data) {
        const shared = normalizeSharedData(data.data);
        skipNextSharedSaveRef.current = true;
        setTripName(shared.tripName);
        setColumns(shared.columns);
        setItems(shared.items);
        setLastRemoteUpdate(data.updated_at || "");
      } else {
        const firstSavedAt = new Date().toISOString();
        await client.from(SUPABASE_TABLE).upsert({
          id: SUPABASE_ROW_ID,
          data: createSharedData(savedState.tripName, savedState.columns, savedState.items),
          updated_at: firstSavedAt
        });
        setLastRemoteUpdate(firstSavedAt);
      }

      setSharedReady(true);
      setSharedStatus("shared");
      setSharedMessage("Shared online. Updates save for both computers.");
      setHasLoadedShared(true);
    }

    loadSharedTrip();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!sharedReady || !hasLoadedShared) return;

    const client = createSupabaseClient();
    if (!client) return;

    if (skipNextSharedSaveRef.current) {
      skipNextSharedSaveRef.current = false;
      return;
    }

    setSharedStatus("syncing");
    setSharedMessage("Saving online...");

    const timeoutId = setTimeout(async () => {
      const savedAt = new Date().toISOString();
      const { error } = await client.from(SUPABASE_TABLE).upsert({
        id: SUPABASE_ROW_ID,
        data: createSharedData(tripName, columns, items),
        updated_at: savedAt
      });

      if (error) {
        setSharedStatus("error");
        setSharedMessage("Could not save online. It is still saved on this device.");
        return;
      }

      setSharedStatus("shared");
      setSharedMessage("Saved online for both computers.");
      setLastRemoteUpdate(savedAt);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [tripName, columns, items, sharedReady, hasLoadedShared]);

  useEffect(() => {
    if (!sharedReady || !hasLoadedShared) return;

    const client = createSupabaseClient();
    if (!client) return;

    const intervalId = setInterval(async () => {
      if (editingItem) return;

      const { data, error } = await client
        .from(SUPABASE_TABLE)
        .select("data, updated_at")
        .eq("id", SUPABASE_ROW_ID)
        .maybeSingle();

      if (error || !data?.data || !data.updated_at || data.updated_at === lastRemoteUpdate) return;

      const shared = normalizeSharedData(data.data);
      skipNextSharedSaveRef.current = true;
      setTripName(shared.tripName);
      setColumns(shared.columns);
      setItems(shared.items);
      setLastRemoteUpdate(data.updated_at);
      setSharedStatus("shared");
      setSharedMessage("Updated from shared online save.");
    }, 10000);

    return () => clearInterval(intervalId);
  }, [sharedReady, hasLoadedShared, lastRemoteUpdate, editingItem]);

  function openNewItem() {
    setEditingItem(createEmptyItem(columns));
  }

  function saveItem(item) {
    setItems((current) => {
      const exists = current.some((entry) => entry.id === item.id);
      return exists ? current.map((entry) => (entry.id === item.id ? item : entry)) : [...current, item];
    });
    setEditingItem(null);
  }

  function deleteItem(id) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  function addColumn(event) {
    event.preventDefault();
    const cleanName = columnName.trim();
    if (!cleanName) return;

    const id = cleanColumnId(cleanName);
    const uniqueId = columns.some((column) => column.id === id) ? `${id}-${Date.now()}` : id;
    const newColumn = { id: uniqueId, label: cleanName, type: "text", custom: true };

    setColumns((current) => [...current, newColumn]);
    setItems((current) => current.map((item) => ({ ...item, [uniqueId]: "" })));
    setColumnName("");
  }

  function removeColumn(columnId) {
    setColumns((current) => current.filter((column) => column.id !== columnId));
    setItems((current) => current.map((item) => {
      const next = { ...item };
      delete next[columnId];
      return next;
    }));
  }

  function resetSampleData() {
    setTripName("Europe Trip 2026");
    setColumns(defaultColumns);
    setItems(sampleItems);
    setMode("view");
    setEditingItem(null);
  }

  function exportExcel() {
    const csv = buildCsv(columns, items);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${tripName.trim() || "Europe Trip 2026"}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setImportMessage("Exported. Open the CSV file with Excel.");
  }

  function importExcelFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const rows = parseCsv(String(reader.result || ""));
      const headers = rows[0] || [];
      const dataRows = rows.slice(1);

      const headerMap = headers.reduce((map, header, index) => {
        map[header.trim().toLowerCase()] = index;
        return map;
      }, {});

      const knownHeaders = new Set([
        "date",
        "place",
        "morning time",
        "morning plan",
        "evening time",
        "evening plan",
        "night time",
        "night plan",
        "transport",
        "distance",
        "cost",
        "notes"
      ]);

      const customColumns = headers
        .filter((header) => header.trim() && !knownHeaders.has(header.trim().toLowerCase()))
        .map((header) => ({ id: cleanColumnId(header), label: header.trim(), type: "text", custom: true }));

      const nextColumns = [...defaultColumns, ...customColumns];
      const nextItems = dataRows.map((row) => {
        const cell = (name) => row[headerMap[name]] || "";
        const item = {
          id: crypto.randomUUID(),
          date: cell("date"),
          place: cell("place"),
          sessions: {
            morning: { time: cell("morning time"), plan: cell("morning plan") },
            evening: { time: cell("evening time"), plan: cell("evening plan") },
            night: { time: cell("night time"), plan: cell("night plan") }
          },
          transport: cell("transport"),
          distance: cell("distance"),
          cost: cell("cost"),
          notes: cell("notes")
        };

        customColumns.forEach((column) => {
          item[column.id] = row[headers.indexOf(column.label)] || "";
        });

        return normalizeItem(item);
      });

      setColumns(nextColumns);
      setItems(nextItems);
      setImportMessage(`Imported ${nextItems.length} itinerary items from Excel CSV.`);
      event.target.value = "";
    };
    reader.readAsText(file);
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f8fafc_0%,#f5f1e8_52%,#eff6f3_100%)]">
      <TopBar
        tripName={tripName}
        setTripName={setTripName}
        isEditMode={isEditMode}
        setMode={setMode}
        openNewItem={openNewItem}
      />

      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <section className="mb-5 grid gap-3 sm:grid-cols-3">
          <SummaryCard label="Items" value={items.length} />
          <SummaryCard label="Places" value={cityCount} />
          <SummaryCard label="Mode" value={isEditMode ? "Edit" : "View"} />
        </section>

        <SaveStatus status={sharedStatus} message={sharedMessage} onSync={syncFromOnline} />

        {isEditMode && (
          <EditControls
            columnName={columnName}
            setColumnName={setColumnName}
            addColumn={addColumn}
            resetSampleData={resetSampleData}
            exportExcel={exportExcel}
            importExcelFile={importExcelFile}
            importInputRef={importInputRef}
            importMessage={importMessage}
          />
        )}

        <ItineraryCards
          columns={columns}
          items={items}
          isEditMode={isEditMode}
          onEdit={setEditingItem}
          onDelete={deleteItem}
        />

        <ItineraryTable
          columns={columns}
          items={items}
          isEditMode={isEditMode}
          onEdit={setEditingItem}
          onDelete={deleteItem}
          onRemoveColumn={removeColumn}
        />
      </main>

      {editingItem && (
        <ItemEditor
          columns={columns}
          item={editingItem}
          onCancel={() => setEditingItem(null)}
          onSave={saveItem}
        />
      )}
    </div>
  );
}

function TopBar({ tripName, setTripName, isEditMode, setMode, openNewItem }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-teal-700">Travel Planner</p>
          <input
            className="mt-1 w-full min-w-0 rounded-md border border-transparent bg-transparent text-2xl font-black text-slate-950 outline-none focus:border-teal-200 focus:bg-teal-50 sm:text-3xl"
            value={tripName}
            onChange={(event) => setTripName(event.target.value)}
            aria-label="Trip name"
          />
        </div>
        <div className="flex gap-2">
          <button
            className={`flex-1 rounded-lg px-4 py-3 text-base font-bold sm:flex-none ${isEditMode ? "bg-slate-900 text-white" : "bg-teal-700 text-white"}`}
            onClick={() => setMode(isEditMode ? "view" : "edit")}
          >
            {isEditMode ? "View Mode" : "Edit Mode"}
          </button>
          {isEditMode && (
            <button className="btn-primary flex-1 sm:flex-none" onClick={openNewItem}>
              Add
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function SaveStatus({ status, message, onSync }) {
  const styles = {
    checking: "border-slate-200 bg-white text-slate-700",
    syncing: "border-amber-200 bg-amber-50 text-amber-900",
    shared: "border-teal-200 bg-teal-50 text-teal-900",
    local: "border-slate-200 bg-white text-slate-700",
    error: "border-rose-200 bg-rose-50 text-rose-900"
  };
  const label = status === "shared" ? "Shared Online" : status === "syncing" ? "Syncing" : status === "error" ? "Needs Setup" : "This Device Only";

  return (
    <div className={`mb-5 grid gap-3 rounded-lg border px-4 py-3 text-base font-semibold sm:grid-cols-[1fr_auto] sm:items-center ${styles[status] || styles.local}`}>
      <p><span className="font-black">{label}:</span> {message}</p>
      <button className="btn-soft bg-white px-3 py-2" type="button" onClick={onSync}>
        Sync Now
      </button>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
      <p className="text-sm font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function EditControls({ columnName, setColumnName, addColumn, resetSampleData, exportExcel, importExcelFile, importInputRef, importMessage }) {
  return (
    <section className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
        <form className="grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={addColumn}>
          <label className="field-label">
            Add custom column
            <input
              className="field-input"
              value={columnName}
              onChange={(event) => setColumnName(event.target.value)}
              placeholder="Example: Booking Ref, Hotel, Food"
            />
          </label>
          <button className="btn-soft" type="submit">
            Add Column
          </button>
        </form>
        <button className="btn-soft" onClick={resetSampleData}>
          Reload Sample
        </button>
      </div>
      <div className="mt-4 grid gap-3 border-t border-slate-200 pt-4 sm:grid-cols-[auto_auto_1fr] sm:items-center">
        <button className="btn-primary" type="button" onClick={exportExcel}>
          Export Excel
        </button>
        <button className="btn-soft" type="button" onClick={() => importInputRef.current?.click()}>
          Import Excel CSV
        </button>
        <input
          ref={importInputRef}
          className="hidden"
          type="file"
          accept=".csv,text/csv"
          onChange={importExcelFile}
        />
        <p className="text-sm font-semibold text-slate-500">
          {importMessage || "Excel export uses CSV, which opens cleanly in Microsoft Excel."}
        </p>
      </div>
    </section>
  );
}

function ItineraryCards({ columns, items, isEditMode, onEdit, onDelete }) {
  return (
    <section className="grid gap-4 lg:hidden">
      {items.map((item) => (
        <article key={item.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-lg font-black text-slate-950">{item.date || "Date not set"}</p>
              <p className="mt-1 text-xl font-black text-teal-800">{item.place || "Place not set"}</p>
            </div>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-800">3 sessions</span>
          </div>

          <SessionDisplay sessions={item.sessions} />

          <div className="grid gap-3">
            {columns
              .filter((column) => !["date", "place"].includes(column.id))
              .map((column) => (
                <FieldDisplay key={column.id} label={column.label} value={item[column.id]} />
              ))}
          </div>

          {isEditMode && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button className="btn-soft" onClick={() => onEdit(item)}>Edit</button>
              <button className="btn-danger" onClick={() => onDelete(item.id)}>Delete</button>
            </div>
          )}
        </article>
      ))}
    </section>
  );
}

function ItineraryTable({ columns, items, isEditMode, onEdit, onDelete, onRemoveColumn }) {
  return (
    <section className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft lg:block">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] border-collapse text-left text-base">
          <thead className="bg-slate-100 text-sm uppercase tracking-wide text-slate-600">
            <tr>
              {columns.map((column) => (
                <th key={column.id} className="border-b border-slate-200 px-4 py-3 font-black">
                  <div className="flex items-center gap-2">
                    <span>{column.label}</span>
                    {isEditMode && column.custom && (
                      <button
                        className="rounded bg-rose-100 px-2 py-1 text-xs font-black text-rose-700"
                        onClick={() => onRemoveColumn(column.id)}
                        title={`Remove ${column.label}`}
                      >
                        X
                      </button>
                    )}
                  </div>
                </th>
              ))}
              <th className="border-b border-slate-200 px-4 py-3 font-black">Sessions</th>
              {isEditMode && <th className="border-b border-slate-200 px-4 py-3 font-black">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="align-top odd:bg-white even:bg-slate-50">
                {columns.map((column) => (
                  <td key={column.id} className="border-b border-slate-200 px-4 py-4">
                    <span className={column.id === "notes" ? "block max-w-md leading-relaxed" : "font-semibold"}>
                      {item[column.id] || "-"}
                    </span>
                  </td>
                ))}
                <td className="border-b border-slate-200 px-4 py-4">
                  <SessionDisplay sessions={item.sessions} compact />
                </td>
                {isEditMode && (
                  <td className="border-b border-slate-200 px-4 py-4">
                    <div className="flex gap-2">
                      <button className="btn-soft px-3 py-2" onClick={() => onEdit(item)}>Edit</button>
                      <button className="btn-danger px-3 py-2" onClick={() => onDelete(item.id)}>Delete</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SessionDisplay({ sessions, compact = false }) {
  const safeSessions = { ...createEmptySessions(), ...(sessions || {}) };

  return (
    <div className={`grid gap-3 ${compact ? "min-w-[360px]" : "mb-3"}`}>
      {sessionTypes.map((session) => {
        const entry = safeSessions[session.id] || { time: "", plan: "" };
        return (
          <div key={session.id} className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="mb-1 flex items-center justify-between gap-3">
              <p className="text-sm font-black uppercase tracking-wide text-teal-700">{session.label}</p>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-sm font-bold text-slate-700">{entry.time || "Time TBC"}</span>
            </div>
            <p className="whitespace-pre-wrap text-base font-semibold leading-relaxed text-slate-900">{entry.plan || "-"}</p>
          </div>
        );
      })}
    </div>
  );
}

function FieldDisplay({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-sm font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-base font-semibold leading-relaxed text-slate-900">{value || "-"}</p>
    </div>
  );
}

function ItemEditor({ columns, item, onCancel, onSave }) {
  const [draft, setDraft] = useState(normalizeItem(item));

  function updateValue(columnId, value) {
    setDraft((current) => ({ ...current, [columnId]: value }));
  }

  function updateSession(sessionId, field, value) {
    setDraft((current) => ({
      ...current,
      sessions: {
        ...createEmptySessions(),
        ...(current.sessions || {}),
        [sessionId]: {
          ...((current.sessions || {})[sessionId] || { time: "", plan: "" }),
          [field]: value
        }
      }
    }));
  }

  function submit(event) {
    event.preventDefault();
    onSave(draft);
  }

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-950/50 p-4">
      <div className="mx-auto my-6 max-w-3xl rounded-lg bg-white p-4 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-teal-700">Itinerary Item</p>
            <h2 className="text-2xl font-black text-slate-950">Add or edit details</h2>
          </div>
          <button className="btn-soft px-3 py-2" onClick={onCancel}>Close</button>
        </div>

        <form className="grid gap-4" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            {columns.map((column) => (
              <label key={column.id} className={`field-label ${column.type === "textarea" ? "sm:col-span-2" : ""}`}>
                {column.label}
                {column.type === "textarea" ? (
                  <textarea
                    className="field-input min-h-28"
                    value={draft[column.id] || ""}
                    onChange={(event) => updateValue(column.id, event.target.value)}
                  />
                ) : (
                  <input
                    className="field-input"
                    value={draft[column.id] || ""}
                    onChange={(event) => updateValue(column.id, event.target.value)}
                  />
                )}
              </label>
            ))}
          </div>

          <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="mb-4">
              <p className="text-sm font-bold uppercase tracking-wide text-teal-700">Daily Sessions</p>
              <h3 className="text-xl font-black text-slate-950">Morning, Evening, Night</h3>
            </div>
            <div className="grid gap-4">
              {sessionTypes.map((session) => {
                const entry = (draft.sessions || {})[session.id] || { time: "", plan: "" };
                return (
                  <div key={session.id} className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="mb-3 text-base font-black text-slate-950">{session.label}</p>
                    <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
                      <label className="field-label">
                        Time
                        <input
                          className="field-input"
                          value={entry.time}
                          onChange={(event) => updateSession(session.id, "time", event.target.value)}
                          placeholder="Example: 8:00"
                        />
                      </label>
                      <label className="field-label">
                        Plan
                        <textarea
                          className="field-input min-h-24"
                          value={entry.plan}
                          onChange={(event) => updateSession(session.id, "plan", event.target.value)}
                          placeholder={`What will you do in the ${session.label.toLowerCase()}?`}
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-center">
            <p className="text-sm font-semibold text-slate-500">Saved automatically after you press Save.</p>
            <button className="btn-soft" type="button" onClick={onCancel}>Cancel</button>
            <button className="btn-primary" type="submit">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
