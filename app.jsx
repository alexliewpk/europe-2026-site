const { useEffect, useMemo, useRef, useState } = React;

const STORAGE_KEY = "travel-itinerary-v2";
const EXPENSE_TYPES = ["Food", "Transport", "Ticket", "Shopping", "WC", "Snacks", "Convenient store", "Other"];
const PAY_BY_OPTIONS = ["PK", "CY"];
const COUNTRY_OPTIONS = ["Hungary", "Austria", "Czech Republic"];
const CURRENCY_OPTIONS = ["MYR", "EUR", "HUF", "CZK"];
const FALLBACK_RATES_TO_MYR = {
  MYR: 1,
  EUR: 5.02,
  HUF: 0.0125,
  CZK: 0.205
};
const SUPABASE_TABLE = "trip_itineraries";
const SUPABASE_ROW_ID = "europe-2026";
const SUPABASE_URL = "https://xukgdrnqkwuxsmaqwvta.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_i_QWouaGp43S5jsC0_3UXA_1TyXSMly";

const sessionTypes = [
  { id: "morning", label: "Morning" },
  { id: "evening", label: "Evening" },
  { id: "night", label: "Night" }
];

const sessionStyles = {
  morning: {
    card: "border-yellow-200 bg-yellow-50",
    label: "text-yellow-800",
    time: "bg-yellow-100 text-yellow-900",
    plan: "text-slate-950"
  },
  evening: {
    card: "border-sky-200 bg-sky-50",
    label: "text-sky-800",
    time: "bg-sky-100 text-sky-900",
    plan: "text-slate-950"
  },
  night: {
    card: "border-blue-950 bg-blue-950",
    label: "text-blue-100",
    time: "bg-blue-900 text-white",
    plan: "text-white"
  }
};

const defaultColumns = [
  { id: "date", label: "Date", type: "text" },
  { id: "place", label: "Place", type: "text" },
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

function visibleColumns(columns) {
  return columns.filter((column) => !["transport", "distance", "cost"].includes(column.id));
}

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

function createEmptyExpense() {
  return {
    id: crypto.randomUUID(),
    date: "",
    country: "Hungary",
    type: "Food",
    payBy: "PK",
    currency: "MYR",
    amount: "",
    amountMyr: "",
    rateToMyr: 1,
    notes: ""
  };
}

function inferCountryFromDate(date) {
  if (["25 May", "26 May", "27 May", "28 May"].includes(date)) return "Hungary";
  if (["29 May", "30 May"].includes(date)) return "Austria";
  if (["31 May", "1 June", "2 June"].includes(date)) return "Czech Republic";
  return "Hungary";
}

function normalizeExpense(expense) {
  const currency = expense?.currency || "MYR";
  const payBy = expense?.payBy || "PK";
  const country = expense?.country || inferCountryFromDate(expense?.date);
  const rateToMyr = Number(expense?.rateToMyr || FALLBACK_RATES_TO_MYR[currency] || 1);
  const amount = Number(expense?.amount || 0);
  return {
    ...createEmptyExpense(),
    ...expense,
    id: expense?.id || crypto.randomUUID(),
    country,
    payBy,
    currency,
    rateToMyr,
    amountMyr: Number(expense?.amountMyr || amount * rateToMyr)
  };
}

function money(value, currency = "MYR") {
  return `${currency} ${Number(value || 0).toFixed(2)}`;
}

function expenseMyr(expense) {
  return Number(expense.amountMyr || 0);
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
    items: sampleItems,
    expenses: []
  };

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return fallback;
    return {
      ...fallback,
      ...saved,
      columns: Array.isArray(saved.columns) && saved.columns.length ? visibleColumns(saved.columns) : defaultColumns,
      items: Array.isArray(saved.items) ? saved.items.map(normalizeItem) : sampleItems,
      expenses: Array.isArray(saved.expenses) ? saved.expenses.map(normalizeExpense) : []
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

function createSharedData(tripName, columns, items, expenses) {
  return {
    tripName,
    columns,
    items: items.map(normalizeItem),
    expenses: expenses.map(normalizeExpense)
  };
}

function normalizeSharedData(data) {
  return {
    tripName: data?.tripName || "Europe Trip 2026",
    columns: Array.isArray(data?.columns) && data.columns.length
      ? visibleColumns(data.columns)
      : defaultColumns,
    items: Array.isArray(data?.items) ? data.items.map(normalizeItem) : sampleItems,
    expenses: Array.isArray(data?.expenses) ? data.expenses.map(normalizeExpense) : []
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
  const [expenses, setExpenses] = useState(() => readSavedState().expenses);
  const [page, setPage] = useState(() => (window.location.hash === "#expenses" ? "expenses" : "itinerary"));
  const [editingItem, setEditingItem] = useState(null);
  const [columnName, setColumnName] = useState("");
  const [importMessage, setImportMessage] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [placeFilter, setPlaceFilter] = useState("all");
  const [sharedStatus, setSharedStatus] = useState("checking");
  const [sharedMessage, setSharedMessage] = useState("Checking shared online save...");
  const [sharedReady, setSharedReady] = useState(false);
  const [hasLoadedShared, setHasLoadedShared] = useState(false);
  const [lastRemoteUpdate, setLastRemoteUpdate] = useState("");
  const importInputRef = useRef(null);
  const skipNextSharedSaveRef = useRef(false);

  const isEditMode = false;
  const dateOptions = useMemo(() => [...new Set(items.map((item) => item.date).filter(Boolean))], [items]);
  const placeOptions = useMemo(() => [...new Set(items.map((item) => item.place).filter(Boolean))], [items]);
  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const matchesDate = dateFilter === "all" || item.date === dateFilter;
        const matchesPlace = placeFilter === "all" || item.place === placeFilter;
        return matchesDate && matchesPlace;
      }),
    [items, dateFilter, placeFilter]
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ tripName, mode, columns, items, expenses }));
  }, [tripName, mode, columns, items, expenses]);

  useEffect(() => {
    function handleHashChange() {
      setPage(window.location.hash === "#expenses" ? "expenses" : "itinerary");
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

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
      setSharedMessage("Could not load the shared itinerary. Refresh the page and try again.");
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
    setExpenses(shared.expenses);
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
        setExpenses(shared.expenses);
        setLastRemoteUpdate(data.updated_at || "");
      } else {
        const firstSavedAt = new Date().toISOString();
        await client.from(SUPABASE_TABLE).upsert({
          id: SUPABASE_ROW_ID,
          data: createSharedData(savedState.tripName, savedState.columns, savedState.items, savedState.expenses),
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
        data: createSharedData(tripName, columns, items, expenses),
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
  }, [tripName, columns, items, expenses, sharedReady, hasLoadedShared]);

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
      setExpenses(shared.expenses);
      setLastRemoteUpdate(data.updated_at);
      setSharedStatus("shared");
      setSharedMessage("Updated from shared online save.");
    }, 10000);

    return () => clearInterval(intervalId);
  }, [sharedReady, hasLoadedShared, lastRemoteUpdate, editingItem]);

  function saveItem(item) {
    setItems((current) => {
      const exists = current.some((entry) => entry.id === item.id);
      return exists ? current.map((entry) => (entry.id === item.id ? item : entry)) : [...current, item];
    });
    setEditingItem(null);
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
        page={page}
      />

      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        {page === "expenses" ? (
          <ExpensesPage expenses={expenses} setExpenses={setExpenses} dateOptions={dateOptions} />
        ) : (
          <>
            <FilterBar
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
              placeFilter={placeFilter}
              setPlaceFilter={setPlaceFilter}
              dateOptions={dateOptions}
              placeOptions={placeOptions}
              resultCount={filteredItems.length}
              totalCount={items.length}
            />

            <ItineraryCards
              columns={columns}
              items={filteredItems}
              isEditMode={isEditMode}
              onEdit={setEditingItem}
            />

            <ItineraryTable
              columns={columns}
              items={filteredItems}
              isEditMode={isEditMode}
              onEdit={setEditingItem}
              onRemoveColumn={removeColumn}
            />
          </>
        )}
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

function TopBar({ tripName, setTripName, page }) {
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
        <a
          className="btn-primary flex items-center justify-center text-center"
          href={page === "expenses" ? "#" : "#expenses"}
        >
          {page === "expenses" ? "Itinerary" : "Expenses"}
        </a>
      </div>
    </header>
  );
}

function ExpensesPage({ expenses, setExpenses, dateOptions }) {
  const [draft, setDraft] = useState(createEmptyExpense);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [ratesToMyr, setRatesToMyr] = useState(FALLBACK_RATES_TO_MYR);
  const [rateStatus, setRateStatus] = useState("Using backup rates");
  const [countryFilter, setCountryFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [payFilter, setPayFilter] = useState("all");
  const filteredExpenses = expenses.filter((expense) => {
    const matchesCountry = countryFilter === "all" || expense.country === countryFilter;
    const matchesDate = dateFilter === "all" || expense.date === dateFilter;
    const matchesType = typeFilter === "all" || expense.type === typeFilter;
    const matchesPay = payFilter === "all" || expense.payBy === payFilter;
    return matchesCountry && matchesDate && matchesType && matchesPay;
  });
  const total = filteredExpenses.reduce((sum, expense) => sum + expenseMyr(expense), 0);
  const byType = EXPENSE_TYPES.map((type) => ({
    type,
    total: filteredExpenses
      .filter((expense) => expense.type === type)
      .reduce((sum, expense) => sum + expenseMyr(expense), 0)
  })).filter((entry) => entry.total > 0);
  const byDate = [...new Set(filteredExpenses.map((expense) => expense.date).filter(Boolean))]
    .map((date) => ({
      date,
      total: filteredExpenses
        .filter((expense) => expense.date === date)
        .reduce((sum, expense) => sum + expenseMyr(expense), 0)
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
  const byCountry = COUNTRY_OPTIONS.map((country) => ({
    country,
    total: filteredExpenses
      .filter((expense) => expense.country === country)
      .reduce((sum, expense) => sum + expenseMyr(expense), 0)
  })).filter((entry) => entry.total > 0);
  const byPay = PAY_BY_OPTIONS.map((payBy) => ({
    payBy,
    total: filteredExpenses
      .filter((expense) => expense.payBy === payBy)
      .reduce((sum, expense) => sum + expenseMyr(expense), 0)
  })).filter((entry) => entry.total > 0);
  const convertedDraftAmount = Number(draft.amount || 0) * Number(ratesToMyr[draft.currency] || 1);

  function clearExpenseFilters() {
    setCountryFilter("all");
    setDateFilter("all");
    setTypeFilter("all");
    setPayFilter("all");
  }

  useEffect(() => {
    let cancelled = false;

    async function loadRates() {
      try {
        const response = await fetch("https://api.frankfurter.app/latest?from=EUR&to=MYR,HUF,CZK");
        if (!response.ok) throw new Error("Rate request failed");
        const data = await response.json();
        const eurToMyr = Number(data?.rates?.MYR);
        const eurToHuf = Number(data?.rates?.HUF);
        const eurToCzk = Number(data?.rates?.CZK);
        if (!eurToMyr || !eurToHuf || !eurToCzk) throw new Error("Missing rates");
        if (!cancelled) {
          setRatesToMyr({
            MYR: 1,
            EUR: eurToMyr,
            HUF: eurToMyr / eurToHuf,
            CZK: eurToMyr / eurToCzk
          });
          setRateStatus("Live rates loaded");
        }
      } catch {
        if (!cancelled) setRateStatus("Using backup rates");
      }
    }

    loadRates();
    return () => {
      cancelled = true;
    };
  }, []);

  function updateDraft(field, value) {
    setDraft((current) => ({
      ...current,
      [field]: value,
      ...(field === "date" ? { country: inferCountryFromDate(value) } : {})
    }));
  }

  function addExpense(event) {
    event.preventDefault();
    if (!draft.date || !draft.type || !draft.amount) return;

    const rateToMyr = Number(ratesToMyr[draft.currency] || 1);
    setExpenses((current) => [...current, normalizeExpense({
      ...draft,
      rateToMyr,
      amountMyr: Number(draft.amount || 0) * rateToMyr
    })]);
    setDraft(createEmptyExpense());
  }

  function saveExpense(expense) {
    const rateToMyr = Number(expense.rateToMyr || ratesToMyr[expense.currency] || 1);
    const nextExpense = normalizeExpense({
      ...expense,
      rateToMyr,
      amountMyr: Number(expense.amount || 0) * rateToMyr
    });
    setExpenses((current) => current.map((entry) => (entry.id === nextExpense.id ? nextExpense : entry)));
    setEditingExpenseId(null);
  }

  return (
    <section className="grid gap-5">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <p className="text-sm font-bold uppercase tracking-wide text-teal-700">Expenses</p>
        <h2 className="mt-1 text-2xl font-black text-slate-950">Add trip expense</h2>

        <form className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_auto]" onSubmit={addExpense}>
          <label className="field-label">
            Date
            <select
              className="field-input"
              value={draft.date}
              onChange={(event) => updateDraft("date", event.target.value)}
            >
              <option value="">Choose date</option>
              {dateOptions.map((date) => (
                <option key={date} value={date}>{date}</option>
              ))}
            </select>
          </label>
          <label className="field-label">
            Country
            <select
              className="field-input"
              value={draft.country}
              onChange={(event) => updateDraft("country", event.target.value)}
            >
              {COUNTRY_OPTIONS.map((country) => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </label>
          <label className="field-label">
            Type of expenses
            <select
              className="field-input"
              value={draft.type}
              onChange={(event) => updateDraft("type", event.target.value)}
            >
              {EXPENSE_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
          <label className="field-label">
            Amount
            <input
              className="field-input"
              inputMode="decimal"
              value={draft.amount}
              onChange={(event) => updateDraft("amount", event.target.value)}
              placeholder="0.00"
            />
          </label>
          <label className="field-label">
            Pay by
            <select
              className="field-input"
              value={draft.payBy}
              onChange={(event) => updateDraft("payBy", event.target.value)}
            >
              {PAY_BY_OPTIONS.map((payBy) => (
                <option key={payBy} value={payBy}>{payBy}</option>
              ))}
            </select>
          </label>
          <label className="field-label">
            Currency
            <select
              className="field-input"
              value={draft.currency}
              onChange={(event) => updateDraft("currency", event.target.value)}
            >
              {CURRENCY_OPTIONS.map((currency) => (
                <option key={currency} value={currency}>{currency}</option>
              ))}
            </select>
          </label>
          <button className="btn-primary self-end" type="submit">
            Add
          </button>
          <p className="text-sm font-semibold text-slate-500 md:col-span-7">
            MYR record: <span className="font-black text-slate-950">{money(convertedDraftAmount)}</span> · {rateStatus}
          </p>
          <label className="field-label md:col-span-7">
            Notes
            <input
              className="field-input"
              value={draft.notes}
              onChange={(event) => updateDraft("notes", event.target.value)}
              placeholder="Optional"
            />
          </label>
        </form>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
          <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Total</p>
          <p className="mt-1 text-4xl font-black text-slate-950">{money(total)}</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">All expenses converted to MYR</p>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
          <p className="text-sm font-bold uppercase tracking-wide text-slate-500">By Type</p>
          <div className="mt-3 grid gap-2">
            {byType.length ? byType.map((entry) => (
              <div key={entry.type} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-bold text-slate-700">{entry.type}</span>
                <span className="font-black text-slate-950">{money(entry.total)}</span>
              </div>
            )) : <p className="text-base font-semibold text-slate-500">No expenses yet.</p>}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
          <p className="text-sm font-bold uppercase tracking-wide text-slate-500">By Pay</p>
          <div className="mt-3 grid gap-2">
            {byPay.length ? byPay.map((entry) => (
              <div key={entry.payBy} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-bold text-slate-700">{entry.payBy}</span>
                <span className="font-black text-slate-950">{money(entry.total)}</span>
              </div>
            )) : <p className="text-base font-semibold text-slate-500">No payment records yet.</p>}
          </div>
        </section>
      </div>

      <ExpensesFilterBar
        countryFilter={countryFilter}
        setCountryFilter={setCountryFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        payFilter={payFilter}
        setPayFilter={setPayFilter}
        dateOptions={dateOptions}
        resultCount={filteredExpenses.length}
        totalCount={expenses.length}
        onClear={clearExpenseFilters}
      />

      <section className="grid gap-4 xl:grid-cols-2">
        <ExpenseGraph title="By Country" data={byCountry} />
        <ExpenseGraph title="By Date" data={byDate} />
        <ExpenseGraph title="By Type" data={byType} />
        <ExpenseGraph title="By People" data={byPay} />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Expenses summary</p>
        <div className="mt-3 grid gap-3">
          {filteredExpenses.length ? filteredExpenses.map((expense) => (
            <ExpenseRow
              key={expense.id}
              expense={expense}
              dateOptions={dateOptions}
              isEditing={editingExpenseId === expense.id}
              onEdit={() => setEditingExpenseId(expense.id)}
              onCancel={() => setEditingExpenseId(null)}
              onSave={saveExpense}
            />
          )) : <p className="text-base font-semibold text-slate-500">No expenses match this filter.</p>}
        </div>
      </section>
    </section>
  );
}

function ExpensesFilterBar({
  countryFilter,
  setCountryFilter,
  dateFilter,
  setDateFilter,
  typeFilter,
  setTypeFilter,
  payFilter,
  setPayFilter,
  dateOptions,
  resultCount,
  totalCount,
  onClear
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
      <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Filter by country, date, types, people</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto_auto] xl:items-end">
        <label className="field-label">
          Country
          <select className="field-input" value={countryFilter} onChange={(event) => setCountryFilter(event.target.value)}>
            <option value="all">All countries</option>
            {COUNTRY_OPTIONS.map((country) => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Date
          <select className="field-input" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)}>
            <option value="all">All dates</option>
            {dateOptions.map((date) => (
              <option key={date} value={date}>{date}</option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Types
          <select className="field-input" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option value="all">All types</option>
            {EXPENSE_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </label>
        <label className="field-label">
          People
          <select className="field-input" value={payFilter} onChange={(event) => setPayFilter(event.target.value)}>
            <option value="all">All people</option>
            {PAY_BY_OPTIONS.map((payBy) => (
              <option key={payBy} value={payBy}>{payBy}</option>
            ))}
          </select>
        </label>
        <button className="btn-soft" type="button" onClick={onClear}>
          Clear
        </button>
        <p className="text-sm font-bold text-slate-500 md:text-right">
          Showing {resultCount} of {totalCount}
        </p>
      </div>
    </section>
  );
}

function ExpenseGraph({ title, data }) {
  const maxTotal = Math.max(...data.map((entry) => entry.total), 0);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
      <p className="text-sm font-bold uppercase tracking-wide text-slate-500">{title}</p>
      <div className="mt-4 grid gap-3">
        {data.length ? data.map((entry) => {
          const label = entry.country || entry.date || entry.type || entry.payBy;
          const width = maxTotal ? Math.max(8, (entry.total / maxTotal) * 100) : 0;
          return (
            <div key={label} className="grid gap-1">
              <div className="flex items-center justify-between gap-3 text-sm font-bold">
                <span className="text-slate-700">{label}</span>
                <span className="text-slate-950">{money(entry.total)}</span>
              </div>
              <div className="h-4 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-teal-700"
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        }) : <p className="text-base font-semibold text-slate-500">Add expenses to see the graph.</p>}
      </div>
    </section>
  );
}

function ExpenseRow({ expense, dateOptions, isEditing, onEdit, onCancel, onSave }) {
  const [draft, setDraft] = useState(() => normalizeExpense(expense));

  useEffect(() => {
    setDraft(normalizeExpense(expense));
  }, [expense, isEditing]);

  function updateDraft(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  if (isEditing) {
    return (
      <form
        className="grid gap-3 rounded-lg border border-teal-200 bg-teal-50 p-3 lg:grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr]"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(draft);
        }}
      >
        <label className="field-label">
          Date
          <select className="field-input" value={draft.date} onChange={(event) => updateDraft("date", event.target.value)}>
            <option value="">Choose date</option>
            {dateOptions.map((date) => (
              <option key={date} value={date}>{date}</option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Country
          <select className="field-input" value={draft.country} onChange={(event) => updateDraft("country", event.target.value)}>
            {COUNTRY_OPTIONS.map((country) => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Type
          <select className="field-input" value={draft.type} onChange={(event) => updateDraft("type", event.target.value)}>
            {EXPENSE_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Amount
          <input
            className="field-input"
            inputMode="decimal"
            value={draft.amount}
            onChange={(event) => updateDraft("amount", event.target.value)}
          />
        </label>
        <label className="field-label">
          Currency
          <select className="field-input" value={draft.currency} onChange={(event) => updateDraft("currency", event.target.value)}>
            {CURRENCY_OPTIONS.map((currency) => (
              <option key={currency} value={currency}>{currency}</option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Pay by
          <select className="field-input" value={draft.payBy} onChange={(event) => updateDraft("payBy", event.target.value)}>
            {PAY_BY_OPTIONS.map((payBy) => (
              <option key={payBy} value={payBy}>{payBy}</option>
            ))}
          </select>
        </label>
        <label className="field-label lg:col-span-6">
          Notes
          <input
            className="field-input"
            value={draft.notes}
            onChange={(event) => updateDraft("notes", event.target.value)}
          />
        </label>
        <div className="grid gap-2 sm:grid-cols-2 lg:col-span-6">
          <button className="btn-soft" type="button" onClick={onCancel}>Cancel</button>
          <button className="btn-primary" type="submit">Save</button>
        </div>
      </form>
    );
  }

  return (
    <div className="grid gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_auto] sm:items-center">
      <p className="font-black text-slate-950">{expense.date || "-"}</p>
      <p className="font-bold text-slate-700">{expense.country || inferCountryFromDate(expense.date)}</p>
      <p className="font-bold text-teal-800">{expense.type || "-"}</p>
      <p className="font-bold text-slate-700">{expense.payBy || "PK"}</p>
      <p className="font-bold text-slate-700">{money(expense.amount, expense.currency)}</p>
      <p className="font-black text-slate-950">{money(expenseMyr(expense))}</p>
      <button className="btn-soft px-3 py-2 text-sm" type="button" onClick={onEdit}>
        Edit
      </button>
      {expense.notes && <p className="text-sm font-semibold text-slate-500 sm:col-span-7">{expense.notes}</p>}
    </div>
  );
}

function FilterBar({
  dateFilter,
  setDateFilter,
  placeFilter,
  setPlaceFilter,
  dateOptions,
  placeOptions,
  resultCount,
  totalCount
}) {
  function clearFilters() {
    setDateFilter("all");
    setPlaceFilter("all");
  }

  return (
    <section className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
        <label className="field-label">
          Filter by date
          <select className="field-input" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)}>
            <option value="all">All dates</option>
            {dateOptions.map((date) => (
              <option key={date} value={date}>
                {date}
              </option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Filter by place
          <select className="field-input" value={placeFilter} onChange={(event) => setPlaceFilter(event.target.value)}>
            <option value="all">All places</option>
            {placeOptions.map((place) => (
              <option key={place} value={place}>
                {place}
              </option>
            ))}
          </select>
        </label>
        <button className="btn-soft" type="button" onClick={clearFilters}>
          Clear
        </button>
        <p className="text-sm font-bold text-slate-500 md:text-right">
          Showing {resultCount} of {totalCount}
        </p>
      </div>
    </section>
  );
}

function ItineraryCards({ columns, items, isEditMode, onEdit }) {
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
            <div className="mt-4 grid gap-2">
              <button className="btn-soft" onClick={() => onEdit(item)}>Edit</button>
            </div>
          )}
        </article>
      ))}
    </section>
  );
}

function ItineraryTable({ columns, items, isEditMode, onEdit, onRemoveColumn }) {
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
        const style = sessionStyles[session.id] || sessionStyles.morning;
        return (
          <div key={session.id} className={`rounded-lg border p-3 ${style.card}`}>
            <div className="mb-1 flex items-center justify-between gap-3">
              <p className={`text-sm font-black uppercase tracking-wide ${style.label}`}>{session.label}</p>
              <span className={`rounded-full px-2 py-1 text-sm font-bold ${style.time}`}>{entry.time || "Time TBC"}</span>
            </div>
            <p className={`whitespace-pre-wrap text-base font-semibold leading-relaxed ${style.plan}`}>{entry.plan || "-"}</p>
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
