import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import { useTickets } from '../context/TicketsContext';
import { departmentLabel } from '../data/constants';
import { SearchIcon } from '../components/icons/NavIcons';
import './kanban.css';

const COLUMNS = [
  { status: 'new', title: 'Новые', color: '#ffffff', bg: '#4338ca' },
  { status: 'in_progress', title: 'В работе', color: '#ffffff', bg: '#1d4ed8' },
  { status: 'on_hold', title: 'Ожидают ответа', color: '#ffffff', bg: '#c2660a' },
  { status: 'closed', title: 'Выполнены', color: '#ffffff', bg: '#15803d' },
];

function CardContent({ ticket }) {
  return (
    <>
      <div className="kanban-card-number">{ticket.number}</div>
      <div className="kanban-card-text">
        {ticket.author}; {ticket.title}; {departmentLabel(ticket.department)}
      </div>
    </>
  );
}

function KanbanCard({ ticket }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: ticket.id });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`kanban-card${isDragging ? ' placeholder' : ''}`}
    >
      <CardContent ticket={ticket} />
    </div>
  );
}

function KanbanColumn({ column, tickets }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.status });
  return (
    <div className="kanban-column">
      <div className="kanban-column-header" style={{ background: column.bg, color: column.color }}>
        <span>{column.title}</span>
        <span className="kanban-column-count">{tickets.length}</span>
      </div>
      <div ref={setNodeRef} className={`kanban-column-body${isOver ? ' over' : ''}`}>
        {tickets.map((t) => (
          <KanbanCard key={t.id} ticket={t} />
        ))}
        {tickets.length === 0 && <div className="kanban-empty">Пусто</div>}
      </div>
    </div>
  );
}

export default function Kanban() {
  const { tickets, updateTicket } = useTickets();
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const activeTicket = tickets.find((t) => t.id === activeId);

  const filtered = useMemo(() => {
    if (!search.trim()) return tickets;
    const q = search.trim().toLowerCase();
    return tickets.filter(
      (t) =>
        t.number.toLowerCase().includes(q) ||
        t.author.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q),
    );
  }, [tickets, search]);

  function handleDragStart(event) {
    setActiveId(event.active.id);
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const ticket = tickets.find((t) => t.id === active.id);
    if (ticket && ticket.status !== over.id) {
      updateTicket(ticket.id, { status: over.id });
    }
  }

  return (
    <div className="kanban-page">
      <div className="kanban-searchbar">
        <SearchIcon />
        <input
          placeholder="Поиск по номеру, автору, теме..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-board">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.status}
              column={col}
              tickets={filtered.filter((t) => t.status === col.status)}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTicket && (
            <div className="kanban-card overlay">
              <CardContent ticket={activeTicket} />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
