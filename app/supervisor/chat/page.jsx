"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, db, storage } from "../../lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  doc,
  updateDoc,
  onSnapshot, 
  serverTimestamp 
} from "firebase/firestore";
import { 
  Send, 
  User, 
  MessageSquare, 
  Clock, 
  ArrowLeft,
  Search,
  Paperclip,
  File,
  Download,
  Check,
  CheckCheck
} from "lucide-react";

export default function SupervisorChat() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  const chatEndRef = useRef(null);

  // 1. Get current logged in user details
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setCurrentUser(user);
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch all users from database
  useEffect(() => {
    if (!currentUser) return;
    async function fetchAllUsers() {
      try {
        const q = query(collection(db, "usuarios"));
        const snap = await getDocs(q);
        const lista = snap.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(u => u.id !== currentUser.uid);
        setUsers(lista);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
      setLoadingUsers(false);
    }
    fetchAllUsers();
  }, [currentUser]);

  // 3. Listen to messages and mark received messages as read
  useEffect(() => {
    if (!currentUser || !activeUser) {
      setMessages([]);
      return;
    }

    const chatId = [currentUser.uid, activeUser.id].sort().join("_");
    const q = query(
      collection(db, "mensajes"),
      where("chatId", "==", chatId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Mark received unread messages as read
      snapshot.docs.forEach(async (docSnap) => {
        const d = docSnap.data();
        if (d.emisorId === activeUser.id && !d.leido) {
          try {
            await updateDoc(doc(db, "mensajes", docSnap.id), { leido: true });
          } catch (err) {
            console.error("Error updating leido status:", err);
          }
        }
      });

      // Sort client side by date
      msgList.sort((a, b) => {
        const timeA = a.fecha?.seconds || 0;
        const timeB = b.fecha?.seconds || 0;
        return timeA - timeB;
      });
      setMessages(msgList);
    });

    return () => unsubscribe();
  }, [activeUser, currentUser]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const [subiendoArchivo, setSubiendoArchivo] = useState(false);

  // Helper to determine if file is an image
  function esImagen(nombre) {
    if (!nombre) return false;
    const ext = nombre.split('.').pop().toLowerCase();
    return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext);
  }

  // Get localized role configuration
  function getRoleInfo(rol) {
    const r = rol?.toLowerCase();
    if (r === "gerente") return { label: "Gerente", className: "tag-gerente" };
    if (r === "recursos humanos" || r === "rrhh") return { label: "R.R.H.H.", className: "tag-rrhh" };
    if (r === "supervisor") return { label: "Supervisor", className: "tag-supervisor" };
    if (r === "administrador") return { label: "Administrador", className: "tag-admin" };
    return { label: rol || "Usuario", className: "tag-default" };
  }

  // 4. Send Message
  async function handleSendMessage(e) {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !activeUser) return;

    const text = newMessage;
    setNewMessage("");

    const chatId = [currentUser.uid, activeUser.id].sort().join("_");

    try {
      await addDoc(collection(db, "mensajes"), {
        chatId,
        emisorId: currentUser.uid,
        emisorNombre: currentUser.displayName || "Supervisor",
        receptorId: activeUser.id,
        mensaje: text,
        leido: false,
        fecha: serverTimestamp()
      });
    } catch (error) {
      console.error("Error sending message:", error);
      alert("❌ Error al enviar mensaje");
    }
  }

  // 4.1 Send File / Attachment
  async function handleSendFile(e) {
    const file = e.target.files?.[0];
    if (!file || !currentUser || !activeUser) return;

    setSubiendoArchivo(true);
    const chatId = [currentUser.uid, activeUser.id].sort().join("_");
    const fileRef = ref(storage, `chats/${chatId}/${Date.now()}_${file.name}`);

    try {
      const snap = await uploadBytes(fileRef, file);
      const url = await getDownloadURL(snap.ref);

      await addDoc(collection(db, "mensajes"), {
        chatId,
        emisorId: currentUser.uid,
        emisorNombre: currentUser.displayName || "Supervisor",
        receptorId: activeUser.id,
        mensaje: `📎 Archivo adjunto: ${file.name}`,
        archivoUrl: url,
        archivoNombre: file.name,
        leido: false,
        fecha: serverTimestamp()
      });
    } catch (error) {
      console.error("Error al subir archivo:", error);
      alert("❌ Error al subir archivo: " + error.message);
    }
    setSubiendoArchivo(false);
  }

  // Filter list of users
  const usersFiltrados = users.filter(u => 
    `${u.nombres || ""} ${u.apellidos || ""}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  return (
    <div className="chatLayout">
      {/* SIDEBAR DE CHAT */}
      <aside className="sidebarChat">
        <div className="headerSidebar">
          <button className="volverBtn" onClick={() => router.push("/supervisor")}>
            <ArrowLeft size={16} /> Panel
          </button>
          <h2>Mensajería</h2>
        </div>

        <div className="searchBox">
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar contacto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="userList">
          {loadingUsers ? (
            <p className="statusMsg">Cargando contactos...</p>
          ) : usersFiltrados.length === 0 ? (
            <p className="statusMsg">No se encontraron contactos</p>
          ) : (
            usersFiltrados.map(u => (
              <div
                key={u.id}
                className={`userItem ${activeUser?.id === u.id ? "active" : ""}`}
                onClick={() => setActiveUser(u)}
              >
                <div className="avatar">
                  <User size={18} />
                </div>
                <div className="userInfo">
                  <h4>{u.nombres} {u.apellidos}</h4>
                  <span className={`rolBadge ${getRoleInfo(u.rol).className}`}>
                    {getRoleInfo(u.rol).label}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* CHAT WINDOW */}
      <main className="chatWindow">
        {activeUser ? (
          <>
            {/* CHAT HEADER */}
            <div className="chatHeader">
              <div className="chatUserAvatar">
                <User size={20} />
              </div>
              <div>
                <h3>{activeUser.nombres} {activeUser.apellidos}</h3>
                <span className={`rolBadge ${getRoleInfo(activeUser.rol).className}`} style={{ fontSize: "11px", padding: "2px 8px" }}>
                  {getRoleInfo(activeUser.rol).label}
                </span>
              </div>
            </div>

            {/* CHAT MESSAGES */}
            <div className="chatMessages">
              {messages.length === 0 ? (
                <div className="noMessages">
                  <MessageSquare size={36} />
                  <p>Inicia la conversación. Escribe un mensaje abajo.</p>
                </div>
              ) : (
                messages.map(m => {
                  const isMine = m.emisorId === currentUser?.uid;
                  const dateStr = m.fecha ? new Date(m.fecha.seconds * 1000).toLocaleTimeString("es-VE", { hour: '2-digit', minute: '2-digit' }) : "";
                  
                  return (
                    <div key={m.id} className={`messageRow ${isMine ? "mine" : "theirs"}`}>
                      <div className="messageBubble">
                        {m.archivoUrl ? (
                          esImagen(m.archivoNombre) ? (
                            <div className="imageAttachment">
                              <img src={m.archivoUrl} alt={m.archivoNombre} className="chatAttachedImg" />
                              <a href={m.archivoUrl} target="_blank" rel="noopener noreferrer" className="downloadLink">
                                <Download size={12} /> Ver Imagen
                              </a>
                            </div>
                          ) : (
                            <div className="fileAttachment">
                              <File size={24} className="fileIcon" />
                              <div className="fileDetails">
                                <span className="fileName" title={m.archivoNombre}>{m.archivoNombre}</span>
                                <a href={m.archivoUrl} target="_blank" rel="noopener noreferrer" className="downloadLink">
                                  <Download size={12} /> Descargar
                                </a>
                              </div>
                            </div>
                          )
                        ) : (
                          <p>{m.mensaje}</p>
                        )}
                        <div className="msgMeta">
                          {dateStr && (
                            <span className="msgTime">
                              {dateStr}
                            </span>
                          )}
                          {isMine && (
                            <span className={`msgCheck ${m.leido ? "read" : "unread"}`} title={m.leido ? "Leído" : "Enviado"}>
                              <CheckCheck size={14} />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* CHAT INPUT */}
            <div className="chatInputWrapper">
              {subiendoArchivo && (
                <div className="subiendoIndicator">
                  <div className="tinySpinner" /> Subiendo archivo...
                </div>
              )}
              <form onSubmit={handleSendMessage} className="chatInputArea">
                <label className="clipBtn" title="Adjuntar archivo">
                  <Paperclip size={18} />
                  <input
                    type="file"
                    onChange={handleSendFile}
                    style={{ display: "none" }}
                    disabled={subiendoArchivo}
                  />
                </label>
                <input
                  type="text"
                  placeholder="Escribe un mensaje..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  maxLength={1000}
                  disabled={subiendoArchivo}
                />
                <button type="submit" className="sendBtn" disabled={subiendoArchivo}>
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="emptyChatState">
            <MessageSquare size={64} style={{ color: "#cbd5e1", marginBottom: "15px" }} />
            <h3>Bandeja de Entrada</h3>
            <p>Selecciona un contacto del panel izquierdo para comenzar a chatear.</p>
          </div>
        )}
      </main>

      <style jsx>{`
        .chatLayout {
          display: flex;
          height: calc(100vh - 60px);
          background: white;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          font-family: system-ui, sans-serif;
        }

        /* SIDEBAR */
        .sidebarChat {
          width: 320px;
          border-right: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          background: #f8fafc;
          flex-shrink: 0;
        }

        .headerSidebar {
          padding: 20px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .headerSidebar h2 {
          font-size: 18px;
          font-weight: 800;
          color: #1e293b;
          margin: 0;
        }

        .volverBtn {
          display: flex;
          align-items: center;
          gap: 6px;
          border: 1px solid #cbd5e1;
          background: white;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          color: #475569;
          cursor: pointer;
        }

        .volverBtn:hover {
          background: #f1f5f9;
        }

        .searchBox {
          padding: 10px 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: white;
          border-bottom: 1px solid #e2e8f0;
          color: #64748b;
        }

        .searchBox input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 14px;
          color: #1e293b;
        }

        .userList {
          flex: 1;
          overflow-y: auto;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .statusMsg {
          text-align: center;
          color: #64748b;
          font-size: 14px;
          margin-top: 20px;
        }

        .userItem {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .userItem:hover {
          background: #f1f5f9;
        }

        .userItem.active {
          background: #fee2e2;
          color: #dc2626;
        }

        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #475569;
          flex-shrink: 0;
        }

        .userItem.active .avatar {
          background: #dc2626;
          color: white;
        }

        .userInfo {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .userInfo h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .rolBadge {
          display: inline-block;
          font-size: 10px;
          font-weight: 800;
          padding: 1px 6px;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          align-self: flex-start;
        }

        .tag-gerente {
          background: rgba(229, 62, 62, 0.1);
          color: #e53e3e;
          border: 1px solid rgba(229, 62, 62, 0.2);
        }

        .tag-rrhh {
          background: rgba(49, 130, 206, 0.1);
          color: #3182ce;
          border: 1px solid rgba(49, 130, 206, 0.2);
        }

        .tag-supervisor {
          background: rgba(49, 151, 149, 0.1);
          color: #319795;
          border: 1px solid rgba(49, 151, 149, 0.2);
        }

        .tag-admin {
          background: rgba(128, 90, 213, 0.1);
          color: #805ad5;
          border: 1px solid rgba(128, 90, 213, 0.2);
        }

        .tag-default {
          background: rgba(113, 128, 150, 0.1);
          color: #718096;
          border: 1px solid rgba(113, 128, 150, 0.2);
        }

        /* CHAT WINDOW */
        .chatWindow {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: white;
          min-width: 0;
        }

        .chatHeader {
          padding: 16px 20px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .chatUserAvatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #fee2e2;
          color: #dc2626;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .chatHeader h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 800;
          color: #1e293b;
        }

        .chatMessages {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          background: #f8fafc;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .noMessages {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #94a3b8;
          gap: 10px;
        }

        .noMessages p {
          margin: 0;
          font-size: 14px;
        }

        .messageRow {
          display: flex;
          width: 100%;
        }

        .messageRow.mine {
          justify-content: flex-end;
        }

        .messageRow.theirs {
          justify-content: flex-start;
        }

        .messageBubble {
          max-width: 70%;
          padding: 12px 16px;
          border-radius: 16px;
          font-size: 14px;
          line-height: 1.5;
          position: relative;
        }

        .mine .messageBubble {
          background: #dc2626;
          color: white;
          border-bottom-right-radius: 4px;
        }

        .theirs .messageBubble {
          background: white;
          color: #1e293b;
          border-bottom-left-radius: 4px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
          border: 1px solid #e2e8f0;
        }

        .messageBubble p {
          margin: 0;
          word-break: break-word;
        }

        .fileAttachment {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          background: rgba(0, 0, 0, 0.05);
          border-radius: 8px;
          min-width: 180px;
        }

        .mine .fileAttachment {
          background: rgba(255, 255, 255, 0.15);
        }

        .fileIcon {
          flex-shrink: 0;
        }

        .fileDetails {
          display: flex;
          flex-direction: column;
          min-width: 0;
          flex: 1;
        }

        .fileName {
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .downloadLink {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 800;
          text-decoration: none;
          margin-top: 3px;
          color: #dc2626;
        }

        .mine .downloadLink {
          color: #fee2e2;
        }

        .downloadLink:hover {
          text-decoration: underline;
        }

        .imageAttachment {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-width: 280px;
        }

        .chatAttachedImg {
          max-width: 100%;
          max-height: 200px;
          border-radius: 8px;
          object-fit: cover;
          border: 1px solid rgba(0, 0, 0, 0.15);
        }

        .msgMeta {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 10px;
          margin-top: 6px;
          justify-content: flex-end;
        }

        .mine .msgTime {
          color: #fca5a5;
        }

        .theirs .msgTime {
          color: #64748b;
        }

        .msgCheck {
          display: inline-flex;
          align-items: center;
        }

        .msgCheck.read {
          color: #38bdf8;
        }

        .msgCheck.unread {
          color: rgba(255, 255, 255, 0.6);
        }

        /* INPUT AREA */
        .chatInputWrapper {
          position: relative;
          display: flex;
          flex-direction: column;
          border-top: 1px solid #e2e8f0;
        }

        .subiendoIndicator {
          position: absolute;
          top: -36px;
          left: 0;
          right: 0;
          height: 36px;
          background: #fffbeb;
          border-top: 1px solid #fef3c7;
          display: flex;
          align-items: center;
          padding: 0 20px;
          font-size: 12px;
          color: #d97706;
          font-weight: 700;
          gap: 8px;
        }

        .tinySpinner {
          width: 14px;
          height: 14px;
          border: 2px solid #fef3c7;
          border-top-color: #d97706;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .chatInputArea {
          padding: 15px 20px;
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .clipBtn {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          border: 1px solid #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
          background: white;
        }

        .clipBtn:hover {
          background: #f1f5f9;
          color: #1e293b;
        }

        .chatInputArea input {
          flex: 1;
          height: 48px;
          border-radius: 12px;
          border: 1px solid #cbd5e1;
          padding: 0 16px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }

        .chatInputArea input:focus {
          border-color: #dc2626;
        }

        .sendBtn {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: #dc2626;
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s, transform 0.1s;
        }

        .sendBtn:hover {
          background: #b91c1c;
        }

        .sendBtn:active {
          transform: scale(0.95);
        }

        .emptyChatState {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          background: #f8fafc;
          color: #64748b;
        }

        .emptyChatState h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 800;
          color: #1e293b;
        }

        .emptyChatState p {
          margin: 0;
          font-size: 14px;
          max-width: 300px;
          text-align: center;
        }

        @media (max-width: 768px) {
          .sidebarChat {
            width: 80px;
          }
          .headerSidebar h2, .searchBox, .userInfo, .volverBtn span {
            display: none;
          }
          .volverBtn {
            padding: 8px;
          }
          .headerSidebar {
            justify-content: center;
            padding: 15px 5px;
          }
          .userItem {
            justify-content: center;
            padding: 10px 5px;
          }
        }
      `}</style>
    </div>
  );
}
