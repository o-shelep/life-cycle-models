import { useRef } from 'react';
import { ImagePlus } from 'lucide-react';
import StarRating from '../../components/StarRating/StarRating';

export default function BookForm({
  form,
  genres,
  coverPreview,
  formError,
  saving,
  isEdit,
  onSubmit,
  onCancel,
  onChange,
  onStatusChange,
  onFileChange,
}) {
  const fileInputRef = useRef(null);

  return (
    <form className="book-form" onSubmit={onSubmit}>
      {formError && <div className="auth-page__error">{formError}</div>}

      <div className="book-form__cover-section">
        {coverPreview ? (
          <div className="book-form__cover-preview-wrap">
            <img src={coverPreview} alt="Cover preview" className="book-form__cover-preview" />
            <button type="button" className="book-form__change-photo"
              onClick={() => fileInputRef.current?.click()}>
              Змінити обкладинку
            </button>
          </div>
        ) : (
          <div className="book-form__upload-zone" onClick={() => fileInputRef.current?.click()}>
            <ImagePlus size={32} className="book-form__upload-icon" />
            <span className="book-form__upload-text">Натисніть, щоб завантажити обкладинку</span>
            <span className="book-form__upload-hint">JPEG, PNG, WEBP</span>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={onFileChange}
        />
      </div>

      <div className="form-group">
        <label>Назва</label>
        <input type="text" placeholder="Назва книжки" value={form.title}
          onChange={e => onChange('title', e.target.value)} autoFocus />
      </div>

      <div className="form-group">
        <label>Автор</label>
        <input type="text" placeholder="Ім'я автора" value={form.author_name}
          onChange={e => onChange('author_name', e.target.value)} />
      </div>

      <div className="form-group">
        <label>Жанр</label>
        <select value={form.genre} onChange={e => onChange('genre', e.target.value)}>
          <option value="">— Немає жанру —</option>
          {genres.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label>Статус</label>
        <select value={form.status} onChange={e => onStatusChange(e.target.value)}>
          <option value="onPlan">У планах</option>
          <option value="inProgress">В процесі</option>
          <option value="read">Прочитано</option>
        </select>
      </div>

      {form.status === 'read' && (
        <div className="book-form__rating-row">
          <label>Оцінка</label>
          <StarRating value={form.rating} onChange={val => onChange('rating', val)} size="lg" />
        </div>
      )}

      <div className="form-group">
        <label>Мій відгук <span className="form-optional">(optional)</span></label>
        <textarea
          placeholder="Напишіть свої думки про цю книгу…"
          value={form.note}
          onChange={e => onChange('note', e.target.value)}
          rows={4}
        />
      </div>

      <div className="book-form__actions">
        <button type="button" className="btn-cancel" onClick={onCancel}>Відмінити</button>
        <button type="submit" className="btn-save" disabled={saving}>
          {saving ? 'Зберігаємо…' : isEdit ? 'Зберегти зміни' : 'Додати книжку'}
        </button>
      </div>
    </form>
  );
}
