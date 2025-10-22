import { useState } from 'react';
import { userAuthStore } from '../features/auth/store/authStore';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const user = userAuthStore((state) => state.user);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // TODO: Implement API call to update user profile
      // const response = await fetch('http://localhost:3000/api/auth/profile', {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`,
      //   },
      //   body: JSON.stringify(formData),
      // });
      
      toast.success('Perfil atualizado com sucesso!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Erro ao atualizar perfil');
      console.error('Profile update error:', error);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
    });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-base-200 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-base-content mb-2">Meu Perfil</h1>
          <p className="text-base-content/70">Gerencie suas informações pessoais</p>
        </div>

        {/* Profile Card */}
        <div className="card bg-base-100 shadow-xl p-6 md:p-8">
          {/* Avatar Section */}
          <div className="flex items-center gap-6 mb-8 pb-6 border-b border-base-300">
            <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-primary-content text-3xl font-bold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-base-content">{user?.name}</h2>
              <p className="text-base-content/70">{user?.email}</p>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-base-content/70 mb-2">
                  Nome
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input input-bordered w-full"
                    required
                  />
                ) : (
                  <p className="px-4 py-3 bg-base-200 rounded-lg text-base-content">
                    {user?.name}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-base-content/70 mb-2">
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input input-bordered w-full"
                    required
                  />
                ) : (
                  <p className="px-4 py-3 bg-base-200 rounded-lg text-base-content">
                    {user?.email}
                  </p>
                )}
              </div>

              {/* Account Information */}
              <div className="pt-6 border-t border-base-300">
                <h3 className="text-lg font-semibold text-base-content mb-4">
                  Informações da Conta
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-base-content/50 mb-1">ID do Usuário</p>
                    <p className="text-sm font-mono bg-base-200 p-2 rounded text-base-content">
                      {user?.id?.substring(0, 8)}...
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/50 mb-1">Status da Conta</p>
                    <p className="text-sm">
                      <span className="badge badge-success gap-2">
                        <span className="w-2 h-2 bg-success-content rounded-full"></span>
                        Ativa
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6">
                {isEditing ? (
                  <>
                    <button
                      type="submit"
                      className="flex-1 btn btn-primary"
                    >
                      Salvar Alterações
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="flex-1 btn btn-ghost"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="flex-1 btn btn-primary"
                  >
                    Editar Perfil
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Security Section */}
        <div className="mt-6 card bg-base-100 shadow-xl p-6 md:p-8">
          <h3 className="text-lg font-semibold text-base-content mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Segurança
          </h3>
          <div className="space-y-3">
            <button
              type="button"
              className="w-full text-left px-4 py-3 bg-base-200 rounded-lg hover:bg-base-300 transition-colors"
              onClick={() => toast('Funcionalidade em desenvolvimento', { icon: 'ℹ️' })}
            >
              <p className="font-medium text-base-content">Alterar Senha</p>
              <p className="text-sm text-base-content/60">Atualize sua senha periodicamente</p>
            </button>
            <button
              type="button"
              className="w-full text-left px-4 py-3 bg-base-200 rounded-lg hover:bg-base-300 transition-colors"
              onClick={() => toast('Funcionalidade em desenvolvimento', { icon: 'ℹ️' })}
            >
              <p className="font-medium text-base-content">Autenticação de Dois Fatores</p>
              <p className="text-sm text-base-content/60">Adicione uma camada extra de segurança</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
