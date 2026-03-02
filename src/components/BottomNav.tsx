import { NavLink } from 'react-router-dom';
import { Home, BookOpen, PenTool, ClipboardList } from 'lucide-react';

export default function BottomNav({ hidden = false }: { hidden?: boolean }) {
  const navItems = [
    { to: '/home', icon: Home, label: 'Home' },
    { to: '/bible', icon: BookOpen, label: 'Bible' },
    { to: '/journal', icon: PenTool, label: 'Journal' },
    { to: '/notes', icon: ClipboardList, label: 'Notes' },
  ];

  return (
    <nav className={`fixed bottom-0 left-0 right-0 bg-bg-elevated border-t border-border pb-safe z-50 transition-transform duration-300 ease-in-out ${hidden ? 'translate-y-full' : 'translate-y-0'}`}>
      <div className="flex justify-around items-center h-[60px] max-w-md mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full min-h-[44px] transition-colors ${
                isActive ? 'text-gold' : 'text-text-muted hover:text-text-secondary'
              }`
            }
          >
            <item.icon size={24} className="mb-1" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
