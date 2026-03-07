import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  User, 
  Scissors, 
  Star, 
  MapPin, 
  Phone, 
  ChevronRight, 
  CheckCircle, 
  Clock,
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Plus,
  Bell,
  Search,
  ArrowLeft,
  ArrowRight,
  Eye,
  Trash2,
  Edit2,
  Check,
  Upload,
  KeyRound
} from 'lucide-react';
import { api } from './services/api';
import { Service, Professional, Booking, Stats, ProfessionalCreatePayload, ProfessionalUpdatePayload } from './types';

// --- Components ---

const Button = ({ children, className = "", variant = "primary", ...props }: any) => {
  const variants = {
    primary: "bg-primary text-background-dark hover:bg-primary/90",
    outline: "border-2 border-primary text-primary hover:bg-primary/5",
    ghost: "text-slate-500 hover:text-primary hover:bg-primary/5",
    danger: "text-red-500 hover:bg-red-50"
  };
  return (
    <button 
      className={`px-6 py-3 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 ${variants[variant as keyof typeof variants]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = "", ...props }: any) => (
  <div className={`bg-white rounded-2xl border border-primary/10 shadow-sm overflow-hidden ${className}`} {...props}>
    {children}
  </div>
);

// --- Client Views ---

const ServicesView = ({ onSelectService }: { onSelectService: (s: Service) => void }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.getServices().then(setServices);
  }, []);

  const filtered = services.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 pb-32 space-y-6">
      <h2 className="text-3xl font-bold">Nossos Serviços</h2>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
          placeholder="Buscar serviços..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="space-y-4">
        {filtered.map(service => (
          <Card key={service.id} className="p-4 flex items-center gap-4">
            <img src={service.image} className="w-16 h-16 rounded-xl object-cover" />
            <div className="flex-1">
              <h3 className="font-bold">{service.name}</h3>
              <p className="text-xs text-slate-400">{service.category}</p>
              <p className="text-primary font-bold text-sm mt-1">R$ {service.price.toFixed(2)}</p>
            </div>
            <Button variant="outline" className="px-4 py-2 text-xs" onClick={() => onSelectService(service)}>Agendar</Button>
          </Card>
        ))}
      </div>
    </div>
  );
};

const AgendaView = ({ currentUser, onGoToLogin }: { currentUser: any, onGoToLogin: () => void }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const loadBookings = () => {
    if (currentUser?.whatsapp) {
      setLoading(true);
      api.getBookings(currentUser.whatsapp).then(userBookings => {
        setBookings(userBookings);
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    }
  };

  useEffect(() => {
    loadBookings();
  }, [currentUser?.whatsapp]);

  const handleCancel = async (id: number) => {
    try {
      await api.deleteBooking(id);
      setCancellingId(null);
      loadBookings();
    } catch (error) {
      console.error("Error cancelling booking:", error);
      alert("Erro ao cancelar agendamento. Tente novamente.");
    }
  };

  if (!currentUser) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[80vh] space-y-8">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <Calendar size={40} />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">Minha Agenda</h2>
          <p className="text-slate-500">Faça login para visualizar seus agendamentos e gerenciar seus horários.</p>
        </div>
        <Button className="w-full" onClick={onGoToLogin}>Fazer Login</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[80vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 pb-32 space-y-6">
      <h2 className="text-3xl font-bold">Minha Agenda</h2>
      <div className="space-y-4">
        {bookings.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Calendar size={48} className="mx-auto mb-4 opacity-20" />
            <p>Você ainda não possui agendamentos.</p>
          </div>
        ) : (
          bookings.map(booking => (
            <Card key={booking.id} className="p-4 border-l-4 border-l-primary relative">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold">{booking.service_name}</h3>
                  <p className="text-xs text-slate-500">{booking.professional_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{booking.date}</p>
                  <p className="text-xs text-primary font-bold">{booking.time}</p>
                </div>
              </div>
              <div className="mt-4 flex justify-between items-center">
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase">Confirmado</span>
                
                {cancellingId === booking.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Confirmar?</span>
                    <button onClick={() => handleCancel(booking.id)} className="text-xs text-red-500 font-bold hover:underline">Sim</button>
                    <button onClick={() => setCancellingId(null)} className="text-xs text-slate-400 font-bold hover:underline">Não</button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setCancellingId(booking.id)}
                    className="text-xs text-red-500 font-bold hover:underline"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

const ProfileView = ({ user, onLogout, onUpdateUser }: { user: any, onLogout: () => void, onUpdateUser: (u: any) => void }) => {
  const [subView, setSubView] = useState<'main' | 'data' | 'notifications' | 'password'>('main');
  const [loginData, setLoginData] = useState({ name: "", whatsapp: "", password: "" });
  const [editData, setEditData] = useState({ name: user?.name || "", email: user?.email || "", image: user?.image || "" });
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(user?.notifications_enabled ?? true);
  const [passwordData, setPasswordData] = useState({ newPassword: "", confirmPassword: "" });
  const [loadingLogin, setLoadingLogin] = useState(false);

  useEffect(() => {
    if (user) {
      setEditData({ name: user.name || "", email: user.email || "", image: user.image || "" });
      setNotificationsEnabled(user.notifications_enabled ?? true);
    }
  }, [user]);

  const handleLogin = async () => {
    if (!loginData.whatsapp || !loginData.password) {
      alert("Informe WhatsApp e senha.");
      return;
    }

    try {
      setLoadingLogin(true);
      const loggedClient = await api.clientLogin(loginData);
      onUpdateUser(loggedClient);
    } catch (error: any) {
      alert(error?.message || "Erro ao entrar no perfil.");
    } finally {
      setLoadingLogin(false);
    }
  };

  const handleUpdateData = async () => {
    if (!user || !editData.name) return;
    try {
      await api.updateClientProfile(user.whatsapp, editData);
      onUpdateUser({ ...user, ...editData });
      setSubView('main');
      alert("Dados atualizados com sucesso.");
    } catch (error: any) {
      alert(error?.message || "Erro ao atualizar dados.");
    }
  };

  const handleUploadProfileImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      const { url } = await api.uploadFile(file);
      await api.updateClientProfile(user.whatsapp, { name: user.name, email: user.email, image: url });
      const updatedUser = { ...user, image: url };
      setEditData(prev => ({ ...prev, image: url }));
      onUpdateUser(updatedUser);
      alert("Foto atualizada com sucesso.");
    } catch (error: any) {
      alert(error?.message || "Erro ao atualizar foto.");
    } finally {
      e.target.value = "";
    }
  };

  const handleToggleNotifications = async () => {
    if (!user) return;
    const nextValue = !notificationsEnabled;
    try {
      await api.updateClientNotifications(user.whatsapp, nextValue);
      setNotificationsEnabled(nextValue);
      onUpdateUser({ ...user, notifications_enabled: nextValue });
    } catch (error: any) {
      alert(error?.message || "Erro ao atualizar notificações.");
    }
  };

  const handleUpdatePassword = async () => {
    if (!user) return;
    if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
      alert("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("A confirmação de senha não confere.");
      return;
    }

    try {
      await api.updateClientPassword(user.whatsapp, passwordData.newPassword);
      setPasswordData({ newPassword: "", confirmPassword: "" });
      setSubView('main');
      alert("Senha alterada com sucesso.");
    } catch (error: any) {
      alert(error?.message || "Erro ao alterar senha.");
    }
  };

  if (!user) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[80vh] space-y-8">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <User size={40} />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">Acesse seu Perfil</h2>
          <p className="text-slate-500">Entre com WhatsApp e senha. Se for seu primeiro acesso, informe também seu nome.</p>
        </div>
        <div className="w-full space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Nome (primeiro acesso)</label>
            <input
              className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
              placeholder="Ex: João Silva"
              value={loginData.name}
              onChange={e => setLoginData({ ...loginData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">WhatsApp</label>
            <input
              className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
              placeholder="Ex: 21999999999"
              value={loginData.whatsapp}
              onChange={e => setLoginData({ ...loginData, whatsapp: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Senha</label>
            <input
              type="password"
              className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
              placeholder="Mínimo 6 caracteres"
              value={loginData.password}
              onChange={e => setLoginData({ ...loginData, password: e.target.value })}
            />
          </div>
          <Button className="w-full" onClick={handleLogin} disabled={loadingLogin}>
            {loadingLogin ? "Entrando..." : "Entrar no Perfil"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pb-32 space-y-8">
      <AnimatePresence mode="wait">
        {subView === 'main' && (
          <motion.div key="main" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-primary/20 p-1 overflow-hidden">
                  <img
                    src={user.image || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=300&q=80"}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <label className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg border-2 border-white cursor-pointer">
                  <Edit2 size={14} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleUploadProfileImage} />
                </label>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold">{user.name}</h3>
                <p className="text-primary text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-1">
                  <Star size={14} className="fill-primary" /> Cliente
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Configurações</h4>
              <Card className="divide-y divide-slate-50">
                {[
                  { icon: <User size={20} />, label: "Meus Dados", id: 'data' },
                  { icon: <Bell size={20} />, label: "Notificações", id: 'notifications' },
                  { icon: <KeyRound size={20} />, label: "Alterar Senha", id: 'password' },
                  { icon: <LogOut size={20} />, label: "Sair", color: "text-red-500", id: 'logout' }
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (item.id === 'logout') onLogout();
                      else if (item.id === 'data') setSubView('data');
                      else if (item.id === 'notifications') setSubView('notifications');
                      else if (item.id === 'password') setSubView('password');
                    }}
                    className={`w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-all ${item.color || 'text-slate-700'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-primary">{item.icon}</span>
                      <span className="font-bold">{item.label}</span>
                    </div>
                    <ChevronRight size={18} className="text-slate-300" />
                  </button>
                ))}
              </Card>
            </div>
          </motion.div>
        )}

        {subView === 'data' && (
          <motion.div key="data" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="flex items-center gap-4">
              <button onClick={() => setSubView('main')} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-2xl font-bold">Meus Dados</h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Nome</label>
                <input
                  className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
                  value={editData.name}
                  onChange={e => setEditData({ ...editData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">E-mail</label>
                <input
                  className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="seu@email.com"
                  value={editData.email}
                  onChange={e => setEditData({ ...editData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">WhatsApp</label>
                <input
                  className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 cursor-not-allowed"
                  value={user.whatsapp}
                  disabled
                />
              </div>
              <Button className="w-full mt-4" onClick={handleUpdateData}>Salvar Alterações</Button>
            </div>
          </motion.div>
        )}

        {subView === 'notifications' && (
          <motion.div key="notifications" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="flex items-center gap-4">
              <button onClick={() => setSubView('main')} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-2xl font-bold">Notificações</h2>
            </div>
            <Card className="p-4">
              <button
                onClick={handleToggleNotifications}
                className="w-full flex items-center justify-between hover:bg-slate-50 transition-all p-2 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-primary"><Bell size={20} /></span>
                  <div className="text-left">
                    <p className="font-bold">Receber notificações</p>
                    <p className="text-xs text-slate-400">Ative ou desative lembretes e novidades.</p>
                  </div>
                </div>
                <div className={`w-12 h-6 rounded-full transition-all relative ${notificationsEnabled ? 'bg-primary' : 'bg-slate-200'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notificationsEnabled ? 'left-7' : 'left-1'}`} />
                </div>
              </button>
            </Card>
          </motion.div>
        )}

        {subView === 'password' && (
          <motion.div key="password" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="flex items-center gap-4">
              <button onClick={() => setSubView('main')} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-2xl font-bold">Alterar Senha</h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Nova senha</label>
                <input
                  type="password"
                  className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
                  value={passwordData.newPassword}
                  onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Confirmar nova senha</label>
                <input
                  type="password"
                  className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
                  value={passwordData.confirmPassword}
                  onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                />
              </div>
              <Button className="w-full" onClick={handleUpdatePassword}>Salvar Nova Senha</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AdminLogin = ({ onLogin, onCancel }: { onLogin: (user: Professional) => void, onCancel: () => void }) => {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError(false);
    try {
      const user = await api.adminLogin({ email, password: pass });
      onLogin(user);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-900 text-white space-y-8">
      <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
        <Settings size={40} />
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Área Restrita</h2>
        <p className="text-slate-400">Acesso exclusivo para administradores e profissionais da Golden Clinic Beauty.</p>
      </div>
      <div className="w-full max-w-xs space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-primary">E-mail</label>
          <input 
            type="email"
            className={`w-full p-4 rounded-xl bg-white/5 border ${error ? 'border-red-500' : 'border-white/10'} focus:ring-2 focus:ring-primary outline-none transition-all`}
            placeholder="seu@email.com"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(false); }}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-primary">Senha de Acesso</label>
          <input 
            type="password"
            className={`w-full p-4 rounded-xl bg-white/5 border ${error ? 'border-red-500' : 'border-white/10'} focus:ring-2 focus:ring-primary outline-none transition-all`}
            placeholder="••••••••"
            value={pass}
            onChange={e => { setPass(e.target.value); setError(false); }}
          />
          {error && <p className="text-red-500 text-xs font-bold">Credenciais incorretas. Tente novamente.</p>}
        </div>
        <Button className="w-full" onClick={handleLogin} disabled={loading}>
          {loading ? "Entrando..." : "Entrar no Painel"}
        </Button>
        <button onClick={onCancel} className="w-full text-slate-500 text-sm font-bold hover:text-white transition-all">Voltar para o App</button>
      </div>
    </div>
  );
};

const HomeView = ({
  onStartBooking,
  onViewAll,
  onOpenServiceDetails,
}: {
  onStartBooking: () => void,
  onViewAll: () => void,
  onOpenServiceDetails: (service: Service) => void,
}) => {
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    api.getServices().then(setServices);
  }, []);

  return (
    <div className="flex flex-col pb-24">
      {/* Hero */}
      <section className="relative h-[500px] flex flex-col justify-end p-6 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `linear-gradient(to top, rgba(20, 18, 10, 0.9) 0%, rgba(212, 175, 53, 0.2) 60%, rgba(0, 0, 0, 0) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuA9u9kFnxQWfvLKDTHGxRLlvxJd0OHexOUpQGlcPbbKlSdoJQ6h1JxWyTXtF8R8wGKEg1wIP0rz3GI_ulIvxO9jst4Lc12nC3xPTB6CbjJL1yDlXWaVoo9e0x7ZtSrzlEzBQd-EZHM3dU96RZ8lfH5c8B68F-VOKiKfQe8ktaHJ1xSjZZadZ4av8bLfi6FLLofWstdoE0ITCpXbO0-dLOqbKZRZlYcMTVu4ZJMpR-JVvIZl7b6A06fznu-EcZtHtumeW51e0Jsa_aQ_")` 
          }}
        />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 space-y-4"
        >
          <h1 className="text-white text-4xl font-bold leading-tight">Realce sua beleza com tratamentos exclusivos</h1>
          <p className="text-white/80 text-sm max-w-xs">A excelência em estética avançada no coração de Copacabana.</p>
          <Button onClick={onStartBooking} className="w-full max-w-xs">
            <Calendar size={20} /> Agende seu horário
          </Button>
        </motion.div>
      </section>

      {/* Value Prop */}
      <section className="p-4 grid grid-cols-2 gap-4 -mt-6 relative z-20">
        {[
          { icon: <User />, title: "Experiência personalizada" },
          { icon: <Star />, title: "Equipe especializada" },
          { icon: <Settings />, title: "Equipamentos de ponta" },
          { icon: <CheckCircle />, title: "Ambiente sofisticado" }
        ].map((item, i) => (
          <Card key={i} className="p-4 flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              {item.icon}
            </div>
            <h4 className="text-xs font-bold">{item.title}</h4>
          </Card>
        ))}
      </section>

      {/* Featured Services */}
      <section className="p-6 space-y-6">
        <div className="flex justify-between items-end">
          <h2 className="text-2xl font-bold">Serviços de Destaque</h2>
          <button onClick={onViewAll} className="text-primary text-sm font-bold underline">Ver todos</button>
        </div>
        <div className="space-y-6">
          {services.map((service) => (
            <Card key={service.id} className="group">
              <div className="h-48 overflow-hidden">
                <img 
                  src={service.image} 
                  alt={service.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-4 space-y-4">
                <h3 className="text-lg font-bold">{service.name}</h3>
                <p className="text-slate-500 text-sm">{service.description || "Tratamentos exclusivos para realçar sua beleza natural."}</p>
                <Button variant="outline" className="w-full" onClick={() => onOpenServiceDetails(service)}>Detalhes</Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white p-8 rounded-t-[2rem] space-y-8">
        <div className="space-y-4">
          <h3 className="text-primary text-2xl font-bold uppercase tracking-widest">Golden Clinic Beauty</h3>
          <div className="flex gap-3 text-slate-400 text-sm">
            <MapPin className="text-primary shrink-0" size={18} />
            <p>Avenida Princesa Isabel, 323, Sala 1009, Copacabana, Rio de Janeiro - RJ</p>
          </div>
        </div>
        <div className="space-y-4">
          <p className="text-primary font-bold text-xs uppercase tracking-widest">Contato</p>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3"><Phone size={16} className="text-primary" /> +55 21 97279-2925</div>
            <div className="flex items-center gap-3"><Star size={16} className="text-primary" /> @goldenclinicbeauty</div>
          </div>
        </div>
        <div className="pt-8 border-t border-white/10 text-center text-[10px] text-slate-500">
          © 2024 Golden Clinic Beauty. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
};

const ServiceDetailsView = ({
  service,
  onBack,
  onBook,
}: {
  service: Service;
  onBack: () => void;
  onBook: () => void;
}) => {
  return (
    <div className="min-h-screen bg-background-light flex flex-col">
      <header className="bg-white p-4 border-b border-primary/10 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-primary"><ArrowLeft /></button>
          <h2 className="text-xl font-bold">Detalhes do Serviço</h2>
          <div className="w-6" />
        </div>
      </header>

      <main className="flex-1 p-6 pb-32 space-y-6">
        <Card className="overflow-hidden">
          <div className="h-60 overflow-hidden">
            <img src={service.image} alt={service.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div className="p-6 space-y-4">
            <div>
              <h1 className="text-3xl font-bold">{service.name}</h1>
              <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">{service.category}</p>
            </div>
            <p className="text-slate-600 leading-relaxed">
              {service.description || "Serviço premium com atendimento especializado e foco na sua experiência."}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-primary/5 p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Duração</p>
                <p className="font-bold">{service.duration} min</p>
              </div>
              <div className="rounded-xl bg-primary/5 p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Valor</p>
                <p className="font-bold text-primary">R$ {service.price.toFixed(2)}</p>
              </div>
            </div>
            {service.professional_name && (
              <div className="rounded-xl border border-primary/10 p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Profissional Responsável</p>
                <p className="font-bold">{service.professional_name}</p>
              </div>
            )}
          </div>
        </Card>
      </main>

      <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md p-6 bg-white/80 backdrop-blur-md border-t border-primary/10">
        <Button className="w-full" onClick={onBook}>
          <Calendar size={20} /> Agendar Este Serviço
        </Button>
      </footer>
    </div>
  );
};

const BookingFlow = ({ onComplete, onCancel, currentUser, initialService }: { onComplete: () => void; onCancel: () => void; currentUser?: { name: string, whatsapp: string } | null, initialService?: Service | null }) => {
  const [step, setStep] = useState(currentUser ? 2 : 1);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  
  const [selectedServices, setSelectedServices] = useState<Service[]>(initialService ? [initialService] : []);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState("");
  const [userData, setUserData] = useState(currentUser || { name: "", whatsapp: "" });
  const [existingBookings, setExistingBookings] = useState<Booking[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (currentUser) {
      setUserData(currentUser);
      setStep(2);
    }
  }, [currentUser]);

  useEffect(() => {
    api.getServices().then(setServices);
    api.getProfessionals().then(p => {
      setProfessionals(p);
      if (p.length > 0) setSelectedProfessional(p[0]);
    });
    api.getBookings().then(setExistingBookings);
  }, []);

  useEffect(() => {
    if (!selectedServices.length || !professionals.length) return;
    const preferredProfessionalId = selectedServices[0].professional_id;
    if (!preferredProfessionalId) return;
    const assignedProfessional = professionals.find(p => p.id === preferredProfessionalId);
    if (assignedProfessional) {
      setSelectedProfessional(assignedProfessional);
    }
  }, [selectedServices, professionals]);

  const handleNext = () => setStep(s => Math.min(s + 1, 5));
  const handleBack = () => {
    if (step === 1 || (step === 2 && currentUser)) {
      onCancel();
    } else {
      setStep(s => Math.max(s - 1, 1));
    }
  };

  const toggleService = (service: Service) => {
    setSelectedServices(prev => {
      const alreadySelected = prev.find(s => s.id === service.id);
      const next = alreadySelected ? prev.filter(s => s.id !== service.id) : [...prev, service];
      if (!alreadySelected && service.professional_id) {
        const assignedProfessional = professionals.find(p => p.id === service.professional_id);
        if (assignedProfessional) setSelectedProfessional(assignedProfessional);
      }
      return next;
    });
  };

  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);

  const isTimeOccupied = (time: string) => {
    return existingBookings.some(b => 
      b.date === selectedDate && 
      b.time === time && 
      b.professional_id === selectedProfessional?.id
    );
  };

  const isTimePast = (time: string) => {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const bookingDate = new Date(selectedDate);
    bookingDate.setHours(hours, minutes, 0, 0);
    return bookingDate < now;
  };

  const handleSubmit = async () => {
    if (selectedServices.length === 0 || !selectedProfessional || !selectedTime) return;
    
    // Create a booking for each selected service
    const bookingPromises = selectedServices.map(service => 
      api.createBooking({
        client_name: userData.name,
        whatsapp: userData.whatsapp,
        service_id: service.id,
        professional_id: selectedProfessional.id,
        date: selectedDate,
        time: selectedTime
      })
    );

    await Promise.all(bookingPromises);
    onComplete();
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay };
  };

  const { days, firstDay } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  const handleMonthChange = (offset: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + offset);
    setCurrentMonth(newMonth);
  };

  return (
    <div className="min-h-screen bg-background-light flex flex-col">
      <header className="bg-white p-4 border-b border-primary/10 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <button onClick={handleBack} className="text-primary"><ArrowLeft /></button>
          <h2 className="text-xl font-bold">Golden Clinic Beauty</h2>
          <div className="w-6" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
            <span className="text-primary">Passo {step} de 5</span>
            <span className="text-slate-400">{step * 20}%</span>
          </div>
          <div className="h-1.5 bg-primary/10 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-primary" 
              initial={{ width: 0 }}
              animate={{ width: `${step * 20}%` }}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 pb-32">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-bold">Dados Pessoais</h2>
              <p className="text-slate-500">Preencha seus dados para prosseguir com a reserva de luxo.</p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest">Nome Completo</label>
                  <input 
                    className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Ex: Alexander Hamilton"
                    value={userData.name}
                    onChange={e => setUserData({ ...userData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest">WhatsApp</label>
                  <div className="flex gap-2">
                    <div className="px-4 py-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-2">
                      🇧🇷 <span className="text-sm font-bold">+55</span>
                    </div>
                    <input 
                      className="flex-1 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
                      placeholder="(00) 00000-0000"
                      value={userData.whatsapp}
                      onChange={e => setUserData({ ...userData, whatsapp: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-bold">O que vamos fazer hoje?</h2>
              <div className="space-y-4">
                {services.map(service => {
                  const isSelected = selectedServices.find(s => s.id === service.id);
                  return (
                    <Card 
                      key={service.id} 
                      className={`p-4 flex items-center gap-4 cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary border-transparent' : ''}`}
                      onClick={() => toggleService(service)}
                    >
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Scissors size={24} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold">{service.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Clock size={12} /> {service.duration} min • <span className="text-primary font-bold">R$ {service.price.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-primary border-primary text-white' : 'border-slate-200'}`}>
                        {isSelected && <Check size={14} />}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-bold">Data e Hora</h2>
              <div className="space-y-6">
                <Card className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold capitalize">{monthName}</h3>
                    <div className="flex gap-2">
                      <button onClick={() => handleMonthChange(-1)} className="p-1 hover:bg-slate-100 rounded-full transition-all"><ArrowLeft size={16} /></button>
                      <button onClick={() => handleMonthChange(1)} className="p-1 hover:bg-slate-100 rounded-full transition-all"><ArrowRight size={16} /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 mb-2">
                    {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map(d => <div key={d}>{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                    {Array.from({ length: days }).map((_, i) => {
                      const day = i + 1;
                      const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                      const dateStr = dateObj.toISOString().split('T')[0];
                      const isSelected = selectedDate === dateStr;
                      const isPast = dateObj < new Date(new Date().setHours(0,0,0,0));
                      
                      return (
                        <button 
                          key={day}
                          disabled={isPast}
                          onClick={() => setSelectedDate(dateStr)}
                          className={`h-10 rounded-lg text-sm font-bold transition-all ${
                            isSelected 
                              ? 'bg-primary text-white shadow-lg' 
                              : isPast 
                                ? 'text-slate-200 cursor-not-allowed' 
                                : 'hover:bg-primary/10'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </Card>

                <div className="space-y-4">
                  <h3 className="font-bold">Horários Disponíveis</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {['09:00', '10:30', '13:00', '14:30', '16:00', '19:00'].map(time => {
                      const occupied = isTimeOccupied(time);
                      const past = isTimePast(time);
                      const disabled = occupied || past;
                      
                      return (
                        <button 
                          key={time}
                          disabled={disabled}
                          onClick={() => setSelectedTime(time)}
                          className={`p-3 rounded-xl border-2 font-bold transition-all relative overflow-hidden ${
                            selectedTime === time 
                              ? 'border-primary bg-primary/5 text-primary' 
                              : disabled
                                ? 'border-slate-50 bg-slate-50 text-slate-300 cursor-not-allowed'
                                : 'border-slate-100 text-slate-400 hover:border-primary/30'
                          }`}
                        >
                          {time}
                          {occupied && <span className="absolute top-0 right-0 bg-red-500 text-[8px] text-white px-1 rounded-bl-md">Ocupado</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-bold">Confira os detalhes</h2>
              <Card className="p-6 space-y-6">
                <div className="flex items-center gap-4 border-b border-primary/5 pb-6">
                  <img src={selectedProfessional?.image} className="w-16 h-16 rounded-xl object-cover" />
                  <div>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Profissional</p>
                    <h3 className="text-lg font-bold">{selectedProfessional?.name}</h3>
                    <p className="text-xs text-slate-400">{selectedProfessional?.specialty}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { icon: <User size={18} />, label: "Cliente", value: userData.name },
                    { icon: <Phone size={18} />, label: "WhatsApp", value: userData.whatsapp },
                    { icon: <Scissors size={18} />, label: "Serviços", value: selectedServices.map(s => s.name).join(", ") },
                    { icon: <Calendar size={18} />, label: "Data", value: new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }) },
                    { icon: <Clock size={18} />, label: "Horário", value: selectedTime }
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="flex items-center gap-3 text-slate-400">
                        <span className="text-primary">{item.icon}</span>
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      <span className="text-sm font-bold text-right max-w-[180px]">{item.value}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-primary/5 p-4 rounded-xl flex justify-between items-center">
                  <span className="font-bold">Total estimado</span>
                  <span className="text-primary text-xl font-extrabold">R$ {totalPrice.toFixed(2)}</span>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md p-6 bg-white/80 backdrop-blur-md border-t border-primary/10 flex gap-4">
        <Button variant="outline" className="flex-1" onClick={handleBack}>Anterior</Button>
        <Button 
          className="flex-[2]" 
          onClick={step === 4 ? handleSubmit : handleNext}
          disabled={(step === 1 && (!userData.name || !userData.whatsapp)) || (step === 2 && selectedServices.length === 0) || (step === 3 && !selectedTime)}
        >
          {step === 4 ? "Confirmar Agendamento" : "Próximo Passo"}
        </Button>
      </footer>
    </div>
  );
};

// --- Admin Views ---

const AdminDashboard = ({ adminUser, onLogout }: { adminUser: Professional, onLogout: () => void }) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tab, setTab] = useState<'dashboard' | 'professionals' | 'services'>('dashboard');
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [showModal, setShowModal] = useState<'service' | 'professional' | 'admin-password' | null>(null);
  const [professionalModalMode, setProfessionalModalMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState<any>({});
  const [adminPasswordData, setAdminPasswordData] = useState({ newPassword: '', confirmPassword: '' });

  const isAdmin = adminUser.role === 'admin';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Selecione apenas arquivos de imagem.");
      e.target.value = '';
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      alert("Imagem muito grande. Envie um arquivo de até 4MB.");
      e.target.value = '';
      return;
    }
    
    try {
      const { url } = await api.uploadFile(file);
      setFormData((prev: any) => ({ ...prev, [field]: url }));
    } catch (err: any) {
      alert(err?.message || "Erro ao fazer upload da imagem");
    } finally {
      e.target.value = '';
    }
  };

  const loadData = () => {
    if (isAdmin) {
      api.getStats().then(setStats);
      api.getBookings().then(setBookings);
      api.getProfessionals().then(setProfessionals);
      api.getServices().then(setServices);
    } else {
      api.getBookings(undefined, adminUser.id).then(setBookings);
    }
  };

  useEffect(() => {
    loadData();
  }, [adminUser]);

  const handleCancelBooking = async (id: number) => {
    if (confirm("Deseja realmente cancelar este agendamento?")) {
      await api.deleteBooking(id);
      loadData();
    }
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await api.updateService(formData.id, formData);
      } else {
        await api.createService(formData);
      }
      setShowModal(null);
      loadData();
    } catch (error: any) {
      alert(error?.message || "Erro ao salvar serviço");
    }
  };

  const openCreateProfessionalModal = () => {
    setProfessionalModalMode('create');
    setFormData({ role: 'professional' });
    setShowModal('professional');
  };

  const openEditProfessionalModal = (professional: Professional) => {
    setProfessionalModalMode('edit');
    setFormData({ ...professional, password: '' });
    setShowModal('professional');
  };

  const handleSaveProfessional = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formData.id) {
        const payload: ProfessionalUpdatePayload = {
          name: formData.name,
          specialty: formData.specialty,
          email: formData.email,
          image: formData.image,
          role: formData.role || 'professional',
          ...(formData.password?.trim() ? { password: formData.password } : {}),
        };
        await api.updateProfessional(formData.id, payload);
        alert("Profissional atualizado com sucesso");
      } else {
        const payload: ProfessionalCreatePayload = {
          name: formData.name,
          specialty: formData.specialty,
          email: formData.email,
          password: formData.password,
          image: formData.image,
          role: formData.role || 'professional',
        };
        await api.createProfessional(payload);
        alert("Profissional cadastrado com sucesso");
      }
      setShowModal(null);
      loadData();
    } catch (error: any) {
      alert(error?.message || "Erro ao salvar profissional");
    }
  };

  const handleSaveAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordData.newPassword.length < 8) {
      alert("A nova senha deve ter no mínimo 8 caracteres");
      return;
    }
    if (adminPasswordData.newPassword !== adminPasswordData.confirmPassword) {
      alert("A confirmação de senha não confere");
      return;
    }

    try {
      await api.updateAdminPassword(adminUser.id, adminPasswordData.newPassword);
      alert("Senha alterada com sucesso");
      setAdminPasswordData({ newPassword: '', confirmPassword: '' });
      setShowModal(null);
    } catch (error: any) {
      alert(error?.message || "Erro ao alterar senha");
    }
  };

  return (
    <div className="min-h-screen bg-background-light flex flex-col md:flex-row">
      {/* Mobile Nav for Admin */}
      <div className="md:hidden flex border-b border-primary/10 bg-white sticky top-0 z-50 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setTab('dashboard')}
          className={`px-6 py-4 text-xs font-bold uppercase tracking-widest whitespace-nowrap border-b-2 transition-all ${tab === 'dashboard' ? 'border-primary text-primary' : 'border-transparent text-slate-400'}`}
        >
          Dashboard
        </button>
        {isAdmin && (
          <>
            <button 
              onClick={() => setTab('professionals')}
              className={`px-6 py-4 text-xs font-bold uppercase tracking-widest whitespace-nowrap border-b-2 transition-all ${tab === 'professionals' ? 'border-primary text-primary' : 'border-transparent text-slate-400'}`}
            >
              Profissionais
            </button>
            <button 
              onClick={() => setTab('services')}
              className={`px-6 py-4 text-xs font-bold uppercase tracking-widest whitespace-nowrap border-b-2 transition-all ${tab === 'services' ? 'border-primary text-primary' : 'border-transparent text-slate-400'}`}
            >
              Serviços
            </button>
          </>
        )}
      </div>

      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-primary/10 p-6 gap-8">
        <div className="flex items-center gap-3 text-primary">
          <Star className="fill-primary" />
          <h1 className="text-xl font-bold uppercase tracking-widest">Golden Admin</h1>
        </div>
        <nav className="flex flex-col gap-2">
          <button 
            onClick={() => setTab('dashboard')}
            className={`flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${tab === 'dashboard' ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-primary/5 hover:text-primary'}`}
          >
            <LayoutDashboard size={20} /> Dashboard
          </button>
          {isAdmin && (
            <>
              <button 
                onClick={() => setTab('professionals')}
                className={`flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${tab === 'professionals' ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-primary/5 hover:text-primary'}`}
              >
                <Users size={20} /> Profissionais
              </button>
              <button 
                onClick={() => setTab('services')}
                className={`flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${tab === 'services' ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-primary/5 hover:text-primary'}`}
              >
                <Scissors size={20} /> Serviços
              </button>
            </>
          )}
        </nav>
      </aside>

      <main className="flex-1 p-6 space-y-8">
        <header className="flex justify-between items-center">
          <h2 className="text-2xl md:text-3xl font-bold capitalize">{tab}</h2>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold">{adminUser.name}</p>
              <p className="text-xs text-slate-400 uppercase tracking-widest">{adminUser.role}</p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowModal('admin-password')}
                className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider text-primary border border-primary/20 rounded-lg hover:bg-primary/5 transition-all"
                title="Alterar minha senha"
              >
                <KeyRound size={14} />
                <span className="hidden sm:inline">Alterar senha</span>
              </button>
            )}
            <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 overflow-hidden">
              <img src={adminUser.image} className="w-full h-full object-cover" />
            </div>
            <button 
              onClick={onLogout}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
              title="Sair"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {tab === 'dashboard' && (
          <>
            {isAdmin && stats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 space-y-4">
                  <div className="flex justify-between">
                    <div className="p-3 bg-primary/10 text-primary rounded-xl"><Calendar /></div>
                    <span className="text-slate-400 text-xs font-bold">0%</span>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Agendamentos Hoje</p>
                    <h3 className="text-3xl font-bold">{stats.appointmentsToday}</h3>
                  </div>
                </Card>
                <Card className="p-6 space-y-4">
                  <div className="flex justify-between">
                    <div className="p-3 bg-primary/10 text-primary rounded-xl"><Users /></div>
                    <span className="text-slate-400 text-xs font-bold">0%</span>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Novos Clientes</p>
                    <h3 className="text-3xl font-bold">{stats.newClients}</h3>
                  </div>
                </Card>
                <Card className="p-6 space-y-4">
                  <div className="flex justify-between">
                    <div className="p-3 bg-primary/10 text-primary rounded-xl"><Scissors /></div>
                    <span className="text-slate-400 text-xs font-bold">0%</span>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Receita Total</p>
                    <h3 className="text-3xl font-bold">R$ {stats.revenue.toFixed(2)}</h3>
                  </div>
                </Card>
              </div>
            )}

            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Agendamentos {isAdmin ? 'Recentes' : 'Meus'}</h3>
              </div>
              <div className="space-y-4">
                {bookings.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Calendar size={48} className="mx-auto mb-4 opacity-20" />
                    <p>Nenhum agendamento encontrado.</p>
                  </div>
                ) : (
                  bookings.map(booking => (
                    <div key={booking.id} className="p-4 bg-slate-50 rounded-xl border border-primary/5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between group hover:bg-primary/5 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-white rounded-lg border border-primary/10 text-center min-w-[70px] shadow-sm relative">
                          <span className="absolute -top-2 -left-2 w-5 h-5 bg-slate-900 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                            #{booking.id}
                          </span>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Data</p>
                          <p className="text-sm font-bold text-slate-900">{booking.date.split('-').reverse().slice(0,2).join('/')}</p>
                          <p className="text-xs text-primary font-bold">{booking.time}</p>
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-900 leading-tight">{booking.client_name}</h4>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Scissors size={12} /> {booking.service_name}
                          </p>
                          {isAdmin && (
                            <p className="text-[10px] text-primary font-bold uppercase tracking-wider">
                              Prof: {booking.professional_name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          Confirmado
                        </span>
                        {isAdmin && (
                          <button 
                            onClick={() => handleCancelBooking(booking.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Cancelar Agendamento"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </>
        )}

        {tab === 'professionals' && isAdmin && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Gerenciar Profissionais</h3>
              <Button onClick={openCreateProfessionalModal}>
                <Plus size={20} /> Novo Profissional
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {professionals.map(p => (
                <Card key={p.id} className="p-4 flex items-center gap-4">
                  <img src={p.image} className="w-16 h-16 rounded-xl object-cover" />
                  <div className="flex-1">
                    <h4 className="font-bold">{p.name}</h4>
                    <p className="text-xs text-slate-400">{p.specialty}</p>
                    <p className="text-[10px] text-primary uppercase font-bold mt-1">{p.role}</p>
                  </div>
                  <button 
                    onClick={() => openEditProfessionalModal(p)}
                    className="p-2 text-slate-400 hover:text-primary transition-all"
                    title="Editar profissional"
                  >
                    <Edit2 size={18} />
                  </button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {tab === 'services' && isAdmin && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Gerenciar Serviços</h3>
              <Button onClick={() => { setFormData({}); setShowModal('service'); }}>
                <Plus size={20} /> Novo Serviço
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map(s => (
                <Card key={s.id} className="p-4 flex items-center gap-4">
                  <img src={s.image} className="w-16 h-16 rounded-xl object-cover" />
                  <div className="flex-1">
                    <h4 className="font-bold">{s.name}</h4>
                    <p className="text-xs text-slate-400">{s.category}</p>
                    {s.professional_name && (
                      <p className="text-[10px] text-slate-500 mt-1">Profissional: {s.professional_name}</p>
                    )}
                    <p className="text-primary font-bold mt-1">R$ {s.price.toFixed(2)}</p>
                  </div>
                  <button 
                    onClick={() => { setFormData(s); setShowModal('service'); }}
                    className="p-2 text-slate-400 hover:text-primary transition-all"
                  >
                    <Edit2 size={18} />
                  </button>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {showModal === 'service' && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <Card className="w-full max-w-md p-6 space-y-6">
            <h3 className="text-2xl font-bold">{formData.id ? 'Editar' : 'Novo'} Serviço</h3>
            <form onSubmit={handleSaveService} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Nome</label>
                <input 
                  required
                  className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary"
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Categoria</label>
                  <input 
                    required
                    className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary"
                    value={formData.category || ''}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Preço (R$)</label>
                  <input 
                    required
                    type="number"
                    step="0.01"
                    className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary"
                    value={formData.price || ''}
                    onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Duração (min)</label>
                <input 
                  required
                  type="number"
                  className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary"
                  value={formData.duration || ''}
                  onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Profissional Responsável</label>
                <select
                  className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary bg-white"
                  value={formData.professional_id || ''}
                  onChange={e => setFormData({ ...formData, professional_id: e.target.value ? parseInt(e.target.value) : null })}
                >
                  <option value="">Selecione um profissional</option>
                  {professionals
                    .filter(p => p.role === 'professional' || p.role === 'admin')
                    .map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Descritivo do Serviço</label>
                <textarea
                  rows={4}
                  className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Descreva o serviço, benefícios, cuidados e resultados esperados."
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Imagem do Serviço</label>
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <input 
                      className="flex-1 p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary text-sm"
                      placeholder="URL da Imagem"
                      value={formData.image || ''}
                      onChange={e => setFormData({ ...formData, image: e.target.value })}
                    />
                    <label className="p-3 bg-primary/10 text-primary rounded-xl cursor-pointer hover:bg-primary/20 transition-all flex items-center justify-center min-w-[50px]">
                      <Upload size={20} />
                      <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'image')} />
                    </label>
                  </div>
                  {formData.image && (
                    <div className="w-full h-32 rounded-xl overflow-hidden border border-primary/10">
                      <img src={formData.image} className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <Button variant="outline" className="flex-1" type="button" onClick={() => setShowModal(null)}>Cancelar</Button>
                <Button className="flex-1" type="submit">Salvar</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {showModal === 'professional' && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <Card className="w-full max-w-md p-6 space-y-6">
            <h3 className="text-2xl font-bold">{professionalModalMode === 'edit' ? 'Editar Profissional' : 'Novo Profissional'}</h3>
            <form onSubmit={handleSaveProfessional} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Nome</label>
                <input 
                  required
                  className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary"
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Especialidade</label>
                <input 
                  required
                  className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary"
                  value={formData.specialty || ''}
                  onChange={e => setFormData({ ...formData, specialty: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">E-mail</label>
                <input 
                  required
                  type="email"
                  className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary"
                  value={formData.email || ''}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Senha</label>
                <input 
                  required={professionalModalMode === 'create'}
                  type="password"
                  className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary"
                  placeholder={professionalModalMode === 'edit' ? 'Deixe vazio para manter' : 'Mínimo de 8 caracteres'}
                  value={formData.password || ''}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Nível de Acesso</label>
                <select
                  className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary bg-white"
                  value={formData.role || 'professional'}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="professional">Profissional</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Foto do Profissional</label>
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <input 
                      className="flex-1 p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary text-sm"
                      placeholder="URL da Foto"
                      value={formData.image || ''}
                      onChange={e => setFormData({ ...formData, image: e.target.value })}
                    />
                    <label className="p-3 bg-primary/10 text-primary rounded-xl cursor-pointer hover:bg-primary/20 transition-all flex items-center justify-center min-w-[50px]">
                      <Upload size={20} />
                      <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'image')} />
                    </label>
                  </div>
                  {formData.image && (
                    <div className="w-20 h-20 rounded-xl overflow-hidden border border-primary/10 mx-auto">
                      <img src={formData.image} className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <Button variant="outline" className="flex-1" type="button" onClick={() => setShowModal(null)}>Cancelar</Button>
                <Button className="flex-1" type="submit">{professionalModalMode === 'edit' ? 'Salvar' : 'Cadastrar'}</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {showModal === 'admin-password' && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <Card className="w-full max-w-md p-6 space-y-6">
            <h3 className="text-2xl font-bold">Alterar Minha Senha</h3>
            <form onSubmit={handleSaveAdminPassword} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Nova senha</label>
                <input
                  required
                  type="password"
                  minLength={8}
                  className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Mínimo de 8 caracteres"
                  value={adminPasswordData.newPassword}
                  onChange={e => setAdminPasswordData({ ...adminPasswordData, newPassword: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Confirmar nova senha</label>
                <input
                  required
                  type="password"
                  minLength={8}
                  className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Repita a nova senha"
                  value={adminPasswordData.confirmPassword}
                  onChange={e => setAdminPasswordData({ ...adminPasswordData, confirmPassword: e.target.value })}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  type="button"
                  onClick={() => {
                    setAdminPasswordData({ newPassword: '', confirmPassword: '' });
                    setShowModal(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button className="flex-1" type="submit">Salvar Senha</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [view, setView] = useState<'home' | 'booking' | 'admin' | 'success' | 'admin-login' | 'service-detail'>('home');
  const [clientTab, setClientTab] = useState<'inicio' | 'servicos' | 'agenda' | 'perfil'>('inicio');
  const [currentUser, setCurrentUser] = useState<{ name: string, whatsapp: string, email?: string, image?: string, notifications_enabled?: boolean } | null>(null);
  const [adminUser, setAdminUser] = useState<Professional | null>(null);
  const [initialService, setInitialService] = useState<Service | null>(null);
  const [selectedServiceDetails, setSelectedServiceDetails] = useState<Service | null>(null);
  const [pendingBooking, setPendingBooking] = useState(false);
  const [pendingService, setPendingService] = useState<Service | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("golden_client_session");
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("golden_client_session");
      }
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("golden_client_session", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("golden_client_session");
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && pendingBooking) {
      setInitialService(pendingService || null);
      setPendingBooking(false);
      setPendingService(null);
      setView('booking');
    }
  }, [currentUser, pendingBooking, pendingService]);

  const handleStartBooking = (service?: Service) => {
    if (!currentUser) {
      setPendingBooking(true);
      setPendingService(service || null);
      setClientTab('perfil');
      setView('home');
      return;
    }
    setInitialService(service || null);
    setView('booking');
  };

  const handleOpenServiceDetails = (service: Service) => {
    setSelectedServiceDetails(service);
    setView('service-detail');
  };

  const isAdminArea = view === 'admin' || view === 'admin-login';

  return (
    <div
      className={
        isAdminArea
          ? "w-full min-h-screen bg-background-light relative"
          : "w-full max-w-md mx-auto min-h-screen bg-background-light shadow-2xl relative md:my-4 md:min-h-[calc(100vh-2rem)] md:rounded-3xl md:overflow-hidden"
      }
    >
      <AnimatePresence mode="wait">
        {view === 'home' && (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {clientTab === 'inicio' && (
              <HomeView
                onStartBooking={() => handleStartBooking()}
                onViewAll={() => setClientTab('servicos')}
                onOpenServiceDetails={handleOpenServiceDetails}
              />
            )}
            {clientTab === 'servicos' && <ServicesView onSelectService={(s) => handleStartBooking(s)} />}
            {clientTab === 'agenda' && (
              <AgendaView 
                currentUser={currentUser} 
                onGoToLogin={() => setClientTab('perfil')} 
              />
            )}
            {clientTab === 'perfil' && (
              <ProfileView 
                user={currentUser} 
                onLogout={() => {
                  setCurrentUser(null);
                  setClientTab('inicio');
                }}
                onUpdateUser={(u) => setCurrentUser(u)}
              />
            )}
            
            <button 
              onClick={() => setView('admin-login')}
              className="fixed bottom-28 right-6 md:right-[calc(50%-12.5rem)] w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-xl z-50"
            >
              <Settings size={20} />
            </button>
          </motion.div>
        )}
        {view === 'booking' && (
          <motion.div key="booking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <BookingFlow 
              onComplete={() => setView('success')} 
              onCancel={() => setView('home')} 
              currentUser={currentUser}
              initialService={initialService}
            />
          </motion.div>
        )}
        {view === 'service-detail' && selectedServiceDetails && (
          <motion.div key="service-detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ServiceDetailsView
              service={selectedServiceDetails}
              onBack={() => setView('home')}
              onBook={() => handleStartBooking(selectedServiceDetails)}
            />
          </motion.div>
        )}
        {view === 'success' && (
          <motion.div 
            key="success" 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-6"
          >
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <CheckCircle size={64} />
            </div>
            <h2 className="text-3xl font-bold">Tudo pronto!</h2>
            <p className="text-slate-500">Seu agendamento foi concluído com sucesso. Você receberá um WhatsApp com todos os detalhes.</p>
            <Button className="w-full" onClick={() => setView('home')}>Voltar para Home</Button>
          </motion.div>
        )}
        {view === 'admin-login' && (
          <motion.div key="admin-login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AdminLogin 
              onLogin={(user) => { setAdminUser(user); setView('admin'); }} 
              onCancel={() => setView('home')} 
            />
          </motion.div>
        )}
        {view === 'admin' && adminUser && (
          <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-none">
            <AdminDashboard adminUser={adminUser} onLogout={() => { setAdminUser(null); setView('home'); }} />
            <button 
              onClick={() => { setAdminUser(null); setView('home'); }}
              className="fixed bottom-6 right-6 w-12 h-12 bg-primary text-background-dark rounded-full flex items-center justify-center shadow-xl z-50"
            >
              <ArrowLeft size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Nav (Client Only) */}
      {['home', 'success'].includes(view) && (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/80 backdrop-blur-md border-t border-primary/10 p-4 flex justify-around items-center z-40">
          <button 
            onClick={() => { setView('home'); setClientTab('inicio'); }}
            className={`flex flex-col items-center gap-1 ${clientTab === 'inicio' ? 'text-primary' : 'text-slate-400'}`}
          >
            <LayoutDashboard size={24} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Início</span>
          </button>
          <button 
            onClick={() => { setView('home'); setClientTab('servicos'); }}
            className={`flex flex-col items-center gap-1 ${clientTab === 'servicos' ? 'text-primary' : 'text-slate-400'}`}
          >
            <Scissors size={24} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Serviços</span>
          </button>
          <button 
            onClick={() => { setView('home'); setClientTab('agenda'); }}
            className={`flex flex-col items-center gap-1 ${clientTab === 'agenda' ? 'text-primary' : 'text-slate-400'}`}
          >
            <Calendar size={24} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Agenda</span>
          </button>
          <button 
            onClick={() => { setView('home'); setClientTab('perfil'); }}
            className={`flex flex-col items-center gap-1 ${clientTab === 'perfil' ? 'text-primary' : 'text-slate-400'}`}
          >
            <User size={24} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Perfil</span>
          </button>
        </nav>
      )}
    </div>
  );
}
