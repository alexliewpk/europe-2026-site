const { useEffect, useMemo, useState } = React;

const STORAGE_KEY = "travel-itinerary-v1";

const defaultColumns = [
  { id: "date", label: "Date", type: "text" },
  { id: "time", label: "Time", type: "text" },
  { id: "place", label: "Place", type: "text" },
  { id: "description", label: "Description", type: "textarea" },
  { id: "transport", label: "Transport", type: "text" },
  { id: "distance", label: "Distance", type: "text" },
  { id: "cost", label: "Cost", type: "text" },
  { id: "notes", label: "Notes", type: "textarea" }
];

const sampleItems = [
  {
    id: "sample-1",
    date: "25 May",
    time: "19:35",
    place: "Budapest",
    description: "Arrive at Budapest airport, transfer to Sipsix Apt, rest.",
    transport: "Airport to hotel, about 40 mins, 30 Euro",
    distance: "",
    cost: "30 Euro",
    notes: "Check in and keep the evening light."
  },
  {
    id: "sample-2",
    date: "26 May",
    time: "Full day",
    place: "Budapest",
    description: "Fisherman's Bastion, Matthias Church, Buda Castle area, museum walk, Chain Bridge, rose ice cream, Danube night cruise.",
    transport: "Hotel to Fisherman's Bastion by Bolt, about 20 mins",
    distance: "",
    cost: "6-10 Euro",
    notes: "Avoid the biggest crowd by starting early."
  },
  {
    id: "sample-3",
    date: "27 May",
    time: "Full day",
    place: "Budapest",
    description: "Hungarian Parliament, St. Stephen's Basilica, New York Cafe, Central Market Hall, sunset at Liberty Bridge.",
    transport: "Walk and local ride",
    distance: "",
    cost: "",
    notes: "Book Parliament visit ahead if possible."
  },
  {
    id: "sample-4",
    date: "28 May",
    time: "09:55",
    place: "Budapest to Vienna",
    description: "Depart by train, arrive Vienna at 12:20, explore Vienna city area.",
    transport: "Train",
    distance: "",
    cost: "12 Euro Bolt to station",
    notes: "Stay at Vienna central apartment."
  },
  {
    id: "sample-5",
    date: "29 May",
    time: "06:28",
    place: "Vienna to Hallstatt",
    description: "Day trip to Hallstatt. Ferry to town, return to Vienna at 16:25, dinner after arrival.",
    transport: "Train and ferry",
    distance: "",
    cost: "",
    notes: "Bring layers and water."
  },
  {
    id: "sample-6",
    date: "30 May",
    time: "10:10",
    place: "Vienna to Prague",
    description: "Depart Vienna, arrive Prague at 14:15, walk Old Town.",
    transport: "Train",
    distance: "",
    cost: "",
    notes: "Stay at Historic Centre Apt 4."
  },
  {
    id: "sample-7",
    date: "31 May",
    time: "Full day",
    place: "Prague",
    description: "Charles Bridge and Prague Castle.",
    transport: "Walk / local transport",
    distance: "",
    cost: "",
    notes: "Start Charles Bridge early."
  },
  {
    id: "sample-8",
    date: "1 June",
    time: "Full day",
    place: "Prague",
    description: "Old Town and Astronomical Clock.",
    transport: "Walk",
    distance: "",
    cost: "",
    notes: "Final full sightseeing day."
  },
  {
    id: "sample-9",
    date: "2 June",
    time: "09:15",
    place: "Prague",
    description: "Fly back to Kuala Lumpur.",
    transport: "Flight",
    distance: "",
    cost: "",
    notes: "Check airport transfer timing."
  }
];

function createEmptyItem(columns) {
  return columns.reduce(
    (item, column) => {
      item[column.id] = "";
      return item;
    },
    { id: crypto.randomUUID() }
  );
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
      items: Array.isArray(saved.items) ? saved.items : sampleItems
    };
  } catch {
    return fallback;
  }
}

function App() {
  const [tripName, setTripName] = useState(() => readSavedState().tripName);
  const [mode, setMode] = useState(() => readSavedState().mode);
  const [columns, setColumns] = useState(() => readSavedState().columns);
  const [items, setItems] = useState(() => readSavedState().items);
  const [editingItem, setEditingItem] = useState(null);
  const [columnName, setColumnName] = useState("");

  const isEditMode = mode === "edit";
  const cityCount = useMemo(() => new Set(items.map((item) => item.place).filter(Boolean)).size, [items]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ tripName, mode, columns, items }));
  }, [tripName, mode, columns, items]);

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

    const id = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `column-${Date.now()}`;
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

        {isEditMode && (
          <EditControls
            columnName={columnName}
            setColumnName={setColumnName}
            addColumn={addColumn}
            resetSampleData={resetSampleData}
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
          <button className="btn-primary flex-1 sm:flex-none" onClick={openNewItem}>
            Add
          </button>
        </div>
      </div>
    </header>
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

function EditControls({ columnName, setColumnName, addColumn, resetSampleData }) {
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
            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-800">{item.time || "Anytime"}</span>
          </div>

          <div className="grid gap-3">
            {columns
              .filter((column) => !["date", "time", "place"].includes(column.id))
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
              {isEditMode && <th className="border-b border-slate-200 px-4 py-3 font-black">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="align-top odd:bg-white even:bg-slate-50">
                {columns.map((column) => (
                  <td key={column.id} className="border-b border-slate-200 px-4 py-4">
                    <span className={column.id === "description" || column.id === "notes" ? "block max-w-md leading-relaxed" : "font-semibold"}>
                      {item[column.id] || "-"}
                    </span>
                  </td>
                ))}
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

function FieldDisplay({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-sm font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-base font-semibold leading-relaxed text-slate-900">{value || "-"}</p>
    </div>
  );
}

function ItemEditor({ columns, item, onCancel, onSave }) {
  const [draft, setDraft] = useState(item);

  function updateValue(columnId, value) {
    setDraft((current) => ({ ...current, [columnId]: value }));
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
