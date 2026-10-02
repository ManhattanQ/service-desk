import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Pencil, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEPARTMENTS, departmentLabel } from '../data/constants';
import './profile.css';

const TIMEZONES = [
  { value: 'Europe/Kaliningrad', label: '(GMT+2:00) Калининград' },
  { value: 'Europe/Moscow', label: '(GMT+3:00) Москва' },
  { value: 'Asia/Yekaterinburg', label: '(GMT+5:00) Екатеринбург' },
  { value: 'Asia/Omsk', label: '(GMT+6:00) Омск' },
  { value: 'Asia/Krasnoyarsk', label: '(GMT+7:00) Красноярск' },
  { value: 'Asia/Irkutsk', label: '(GMT+8:00) Иркутск' },
  { value: 'Asia/Vladivostok', label: '(GMT+10:00) Владивосток' },
];

function initials(firstName, lastName) {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
}

export default function Profile() {
  const navigate = useNavigate();
  const { currentUser, updateUser } = useAuth();

  const [firstName, setFirstName] = useState(currentUser.firstName);
  const [lastName, setLastName] = useState(currentUser.lastName);
  const [department, setDepartment] = useState(currentUser.department);
  const [phone, setPhone] = useState(currentUser.phone ?? '');
  const [timezone, setTimezone] = useState(currentUser.timezone ?? TIMEZONES[1].value);
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl ?? null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef(null);

  function handlePhotoSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUrl(URL.createObjectURL(file));
    e.target.value = '';
  }

  function handleSave() {
    updateUser(currentUser.id, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      department,
      phone: phone.trim(),
      timezone,
      avatarUrl,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const isValid = firstName.trim() && lastName.trim();

  return (
    <div className="pf-page">
      <button type="button" className="pf-back" onClick={() => navigate(-1)}>
        Вернуться назад
      </button>

      <h1 className="pf-title">Мой профиль</h1>

      <div className="pf-layout">
        <div className="pf-card pf-side">
          <div className="pf-avatar-wrap">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="pf-avatar-img" />
            ) : (
              <div className="pf-avatar-placeholder">{initials(firstName, lastName)}</div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="pf-file-hidden" onChange={handlePhotoSelect} />
          <button type="button" className="pf-change-photo" onClick={() => fileInputRef.current?.click()}>
            <Pencil size={13} strokeWidth={2} />
            Изменить фото
          </button>

          <p className="pf-name">
            {firstName} {lastName}
          </p>
          <p className="pf-role">{currentUser.role === 'specialist' ? 'Специалист поддержки' : 'Сотрудник'}</p>
          <p className="pf-contacts">
            {currentUser.email}
            {phone && <> · {phone}</>}
          </p>
        </div>

        <div className="pf-card pf-form">
          <div className="pf-form-header">
            <h2>Информация моего профиля</h2>
            <button type="button" className="pf-save" onClick={handleSave} disabled={!isValid}>
              <Save size={15} strokeWidth={2} />
              {saved ? 'Сохранено' : 'Сохранить'}
            </button>
          </div>

          <div className="pf-field">
            <span className="pf-field-label">Имя</span>
            <input className="pf-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>

          <div className="pf-field">
            <span className="pf-field-label">Фамилия</span>
            <input className="pf-input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>

          <div className="pf-field">
            <span className="pf-field-label">Отдел</span>
            {currentUser.role === 'specialist' ? (
              <input className="pf-input" value={departmentLabel(department)} disabled />
            ) : (
              <select className="pf-input" value={department} onChange={(e) => setDepartment(e.target.value)}>
                {DEPARTMENTS.filter((d) => d.value !== 'it').map((d) => (
                  <option key={d.value} value={d.value}>
                    {departmentLabel(d.value)}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="pf-field">
            <span className="pf-field-label">Email</span>
            <input className="pf-input" value={currentUser.email} disabled />
          </div>

          <div className="pf-field">
            <span className="pf-field-label">Номер</span>
            <input className="pf-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 900 000 00 00" />
          </div>

          <div className="pf-field">
            <span className="pf-field-label">Часовой пояс</span>
            <select className="pf-input" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          <div className="pf-password-header">
            <h2>Пароль</h2>
          </div>
          <div className="pf-field">
            <span className="pf-field-label">Пароль</span>
            <div className="pf-password-row">
              <input className="pf-input" type={passwordVisible ? 'text' : 'password'} value={currentUser.password} disabled />
              <button
                type="button"
                className="pf-password-toggle"
                onClick={() => setPasswordVisible((v) => !v)}
                title={passwordVisible ? 'Скрыть пароль' : 'Показать пароль'}
              >
                {passwordVisible ? <EyeOff size={17} strokeWidth={1.8} /> : <Eye size={17} strokeWidth={1.8} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
