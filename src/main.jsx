import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { entries, profiles } from './data.js';
import './styles.css';

const STORAGE_KEY = 'comunas-v1';
const initialState = { likes: [], saves: [], seen: [], comments: {} };

function loadState() {
  try {
    return { ...initialState, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) };
  } catch {
    return initialState;
  }
}

function Post({ post, liked, saved, comments, onLike, onSave, onComment, onShare }) {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState('');
  const commentInput = useRef(null);

  useEffect(() => {
    if (expanded) commentInput.current?.focus();
  }, [expanded]);

  function submitComment(event) {
    event.preventDefault();
    const message = draft.trim();
    if (!message) return;
    onComment(message);
    setDraft('');
    commentInput.current?.focus();
  }

  return (
    <article className="post" id={'post-' + post.id}>
      <header className="post__header">
        <span className={'avatar ' + post.color} aria-hidden="true">{post.symbol}</span>
        <strong>{post.author}</strong>
      </header>
      <div className={'poster ' + post.color} data-symbol={post.symbol}>
        <small>{post.label}</small>
        <h3>{post.title}</h3>
      </div>
      <div className="post__content">
        <div className="actions">
          <button className="icon" type="button" aria-label="Curtir" aria-pressed={liked} onClick={onLike}>
            {liked ? '★' : '☆'}
          </button>
          <button className="icon" type="button" aria-label="Comentários" aria-expanded={expanded}
            aria-controls={'comments-' + post.id} onClick={() => setExpanded(value => !value)}>◌</button>
          <button className="icon" type="button" aria-label="Compartilhar" onClick={onShare}>↗</button>
          <button className="icon save" type="button" aria-label="Salvar" aria-pressed={saved} onClick={onSave}>
            {saved ? '▮' : '♧'}
          </button>
        </div>
        <strong>{post.likes + Number(liked)} curtidas</strong>
        <p className="caption">
          <strong>{post.author}</strong>{post.caption} <span className="hashtag">#{post.topic}</span>
        </p>
        <div className="comments" id={'comments-' + post.id} hidden={!expanded}>
          {comments.map((message, index) => <p key={index}>Você · {message}</p>)}
          <form onSubmit={submitComment}>
            <input ref={commentInput} aria-label="Seu comentário" placeholder="Escreva um comentário"
              required maxLength={280} value={draft} onChange={event => setDraft(event.target.value)} />
            <button type="submit">Publicar</button>
          </form>
        </div>
      </div>
    </article>
  );
}

function StoryViewer({ active, onSelect, onClose }) {
  const dialog = useRef(null);
  const open = active !== null;
  const person = profiles[active];
  const last = active === profiles.length - 1;

  useEffect(() => {
    const element = dialog.current;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  function goNext() {
    if (last) onClose();
    else onSelect(active + 1);
  }

  function handleKeys(event) {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goNext();
    }
    if (event.key === 'ArrowLeft' && active > 0) {
      event.preventDefault();
      onSelect(active - 1);
    }
  }

  return (
    <dialog ref={dialog} aria-labelledby="slide-title" onCancel={event => {
      event.preventDefault();
      onClose();
    }} onKeyDown={handleKeys} onClick={event => {
      if (event.target === event.currentTarget) onClose();
    }}>
      {person && <div className="story-panel">
        <div className="progress" aria-hidden="true">
          {profiles.map((profile, index) => <span key={profile.id} className={index <= active ? 'current' : ''} />)}
        </div>
        <div className="story-head">
          <span>{active + 1} de {profiles.length}</span>
          <button className="control" type="button" aria-label="Fechar story" onClick={onClose}>×</button>
        </div>
        <div className="story-text">
          <img className="slide-portrait" src={person.photo} alt="" />
          <h2 id="slide-title">{person.name}</h2>
          <p>{person.bio}</p>
          <a className="photo-credit" href={person.source} target="_blank" rel="noopener noreferrer">
            Foto · {person.credit}
          </a>
        </div>
        <div className="story-nav">
          <button className="control" type="button" disabled={active === 0} onClick={() => onSelect(active - 1)}>
            Anterior
          </button>
          <button className="control" type="button" onClick={goNext}>{last ? 'Concluir' : 'Próximo'}</button>
        </div>
      </div>}
    </dialog>
  );
}

function App() {
  const [data, setData] = useState(loadState);
  const [showSaved, setShowSaved] = useState(false);
  const [active, setActive] = useState(null);
  const [notice, setNotice] = useState('');
  const noticeTimer = useRef(null);
  const savedTab = useRef(null);
  const visiblePosts = showSaved ? entries.filter(post => data.saves.includes(post.id)) : entries;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // A página continua utilizável quando o armazenamento está indisponível.
    }
  }, [data]);

  useEffect(() => {
    document.getElementById(location.hash.slice(1))?.scrollIntoView();
    return () => clearTimeout(noticeTimer.current);
  }, []);

  function toggle(field, id) {
    setData(previous => ({
      ...previous,
      [field]: previous[field].includes(id)
        ? previous[field].filter(value => value !== id)
        : [...previous[field], id],
    }));
  }

  function selectStory(index) {
    const id = profiles[index].id;
    setActive(index);
    setData(previous => previous.seen.includes(id) ? previous : {
      ...previous, seen: [...previous.seen, id],
    });
  }

  function addComment(id, message) {
    setData(previous => ({
      ...previous,
      comments: { ...previous.comments, [id]: [...(previous.comments[id] ?? []), message] },
    }));
  }

  async function sharePost(id) {
    const url = new URL(location.href);
    url.hash = 'post-' + id;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Comunas', url: url.href });
      } else {
        await navigator.clipboard.writeText(url.href);
        setNotice('Link copiado.');
        clearTimeout(noticeTimer.current);
        noticeTimer.current = setTimeout(() => setNotice(''), 3200);
      }
    } catch (error) {
      if (error.name !== 'AbortError') window.prompt('Copie o link da publicação', url.href);
    }
  }

  return (
    <>
      <header className="top">
        <div>
          <span className="brand"><b aria-hidden="true">✦</b>Comunas</span>
          <nav aria-label="Navegação principal">
            <button type="button" aria-pressed={!showSaved} onClick={() => setShowSaved(false)}>Feed</button>
            <button ref={savedTab} type="button" aria-pressed={showSaved} onClick={() => setShowSaved(true)}>Salvos</button>
          </nav>
        </div>
      </header>
      <main>
        <section className="mast">
          <h1>Comunas.</h1>
          <p>Um feed sobre comunismo, movimentos sociais e o mundo do trabalho.</p>
        </section>
        <div className="feed">
          {!showSaved && <section aria-labelledby="story-title">
            <h2 className="section-title" id="story-title">Stories</h2>
            <div className="stories">
              {profiles.map((person, index) => {
                const seen = data.seen.includes(person.id);
                return (
                  <button key={person.id} type="button" className={seen ? 'story seen' : 'story'}
                    aria-label={person.name + (seen ? ', visto' : '')} onClick={() => selectStory(index)}>
                    <span className="portrait-ring"><img src={person.photo} alt="" decoding="async" /></span>
                    <strong>{person.name}</strong>
                  </button>
                );
              })}
            </div>
          </section>}
          <section aria-labelledby="feed-title">
            <h2 className="section-title" id="feed-title">{showSaved ? 'Publicações salvas' : 'Publicações'}</h2>
            {visiblePosts.length === 0 && <p className="empty">Nenhuma publicação salva.</p>}
            {visiblePosts.map(post => <Post key={post.id} post={post}
              liked={data.likes.includes(post.id)} saved={data.saves.includes(post.id)}
              comments={data.comments[post.id] ?? []} onLike={() => toggle('likes', post.id)}
              onSave={() => {
                toggle('saves', post.id);
                if (showSaved) savedTab.current?.focus();
              }}
              onComment={message => addComment(post.id, message)} onShare={() => sharePost(post.id)} />)}
          </section>
        </div>
      </main>
      <StoryViewer active={active} onSelect={selectStory} onClose={() => setActive(null)} />
      <div className="notice" role="status">{notice}</div>
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
