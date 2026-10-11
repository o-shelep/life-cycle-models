import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import "./Profile.scss";

export default function Profile() {
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState({
    username: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (user?.username) {
      setForm((prev) => ({ ...prev, username: user.username }));
    }
  }, [user]);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSuccessMsg("");
    setErrorMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    if (!form.currentPassword) {
      setErrorMsg("Теперішній пароль обов'язковий.");
      return;
    }

    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setErrorMsg("Новий пароль не збігається.");
      return;
    }

    const payload = {
      username: form.username.trim(),
      currentPassword: form.currentPassword,
    };
    if (form.newPassword) {
      payload.newPassword = form.newPassword;
    }

    setSaving(true);
    try {
      const res = await api.put("/auth/me", payload);
      updateUser(res.data.user);
      setSuccessMsg("Профіль успішно оновлено.");
      setForm((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        username: res.data.user?.username || prev.username,
      }));
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Не вдалося оновити профіль.");
    } finally {
      setSaving(false);
    }
  };

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "U";

  return (
    <div className="profile-page">
      <div className="profile-page__header">
        <div className="profile-page__avatar">{initials}</div>
        <div className="profile-page__header-info">
          <h1 className="profile-page__username">{user?.username}</h1>
          <span className="profile-page__label">Ваш акаунт</span>
        </div>
      </div>

      <div className="profile-page__body">
        <div className="profile-card">
          <h2 className="profile-card__title">Налаштування акаунту</h2>

          {successMsg && (
            <div className="profile-card__success">{successMsg}</div>
          )}
          {errorMsg && <div className="profile-card__error">{errorMsg}</div>}

          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Ім'я користувача</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => handleChange("username", e.target.value)}
                placeholder="Ваше ім'я користувача"
                autoComplete="username"
              />
            </div>

            <div className="profile-form__divider">
              <span>Змінити пароль</span>
            </div>

            <div className="form-group">
              <label>Теперішній пароль</label>
              <input
                type="password"
                value={form.currentPassword}
                onChange={(e) =>
                  handleChange("currentPassword", e.target.value)
                }
                placeholder="Введіть теперішній пароль"
                autoComplete="current-password"
              />
            </div>

            <div className="form-group">
              <label>
                Новий пароль
                <span className="profile-form__optional">(Не обов'язково)</span>
              </label>
              <input
                type="password"
                value={form.newPassword}
                onChange={(e) => handleChange("newPassword", e.target.value)}
                placeholder="Введіть новий пароль"
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label>
                Підтвердити новий пароль
                <span className="profile-form__optional">(Не обов'язково)</span>
              </label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) =>
                  handleChange("confirmPassword", e.target.value)
                }
                placeholder="Повторіть новий пароль"
                autoComplete="new-password"
              />
            </div>

            <div className="profile-form__actions">
              <button
                type="submit"
                className="profile-form__save-btn"
                disabled={saving}
              >
                {saving ? "Зберігаємо…" : "Зберегти зміни"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
