import React, { useState } from "react";
import { FONT_IMPORT, T, todayISO } from "./theme";
import { Tab } from "./types";
import { useAuth } from "./contexts/AuthContext";
import { useBooks } from "./hooks/useBooks";
import { useTransactions } from "./hooks/useTransactions";
import { Sidebar, BottomNav, TopHeader, LoadingState } from "./components/Layout";
import { Login } from "./components/Login";
import { Dashboard } from "./components/Dashboard";
import { AddForm } from "./components/AddForm";
import { DailyView } from "./components/DailyView";
import { SummaryView } from "./components/SummaryView";
import { ProfileView } from "./components/ProfileView";
import { BookSwitcher } from "./components/BookSwitcher";

function GlobalStyle() {
  return (
    <style>{`
      ${FONT_IMPORT}
      * { box-sizing: border-box; }
      .mono { font-family: 'IBM Plex Mono', monospace; }
      .sn-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
      .sn-scroll::-webkit-scrollbar-thumb { background: ${T.paperLine}; border-radius: 4px; }
      button { font-family: inherit; cursor: pointer; }
      input, select { font-family: inherit; }
      .ledger-lines {
        background-image: repeating-linear-gradient(to bottom, transparent, transparent 27px, ${T.paperLine} 28px);
      }
      @media (max-width: 767px) {
        .sn-sidebar { display: none !important; }
        .sn-bottomnav { display: flex !important; }
        .sn-main { padding-bottom: 84px !important; margin-left: 0 !important; }
      }
    `}</style>
  );
}

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();

  if (authLoading) {
    return (
      <div style={{ fontFamily: "'IBM Plex Sans Thai', system-ui, sans-serif", background: T.paper, minHeight: "100vh" }}>
        <GlobalStyle />
        <LoadingState label="กำลังตรวจสอบการเข้าสู่ระบบ..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ fontFamily: "'IBM Plex Sans Thai', system-ui, sans-serif", background: T.paper, color: T.ink, minHeight: "100vh" }}>
        <GlobalStyle />
        <Login />
      </div>
    );
  }

  return <SignedInApp uid={user.uid} onSignOut={signOut} userDisplayObj={user} />;
}

function SignedInApp({ uid, onSignOut, userDisplayObj }: { uid: string; onSignOut: () => void; userDisplayObj: NonNullable<ReturnType<typeof useAuth>["user"]> }) {
  const { updateUserProfile } = useAuth();
  const { books, activeBook, loaded: booksLoaded, selectBook, createSharedBook, joinSharedBook, approveJoinRequest, rejectJoinRequest, changeMemberRole, removeMember, leaveBook, updateBookName, updateBookPassword, deleteBook, getRememberedBookPassword } = useBooks(uid, userDisplayObj);
  const { transactions, loaded, addTransaction, deleteTransaction } = useTransactions(uid, activeBook, userDisplayObj);
  const canWriteTransactions = activeBook?.kind === "personal" || (activeBook?.kind === "shared" && (activeBook.members[uid]?.role === "owner" || activeBook.members[uid]?.role === "editor"));
  const [tab, setTab] = useState<Tab>("dashboard");
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [savedFlash, setSavedFlash] = useState(false);

  const goToDaily = (iso: string) => {
    setSelectedDate(iso);
    setTab("daily");
  };

  const handleAdd = async (tx: Parameters<typeof addTransaction>[0]) => {
    await addTransaction(tx);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1600);
  };

  return (
    <div style={{ fontFamily: "'IBM Plex Sans Thai', system-ui, sans-serif", background: T.paper, color: T.ink, minHeight: "100vh", display: "flex" }}>
      <GlobalStyle />

      <Sidebar tab={tab} setTab={setTab} user={userDisplayObj} onSignOut={onSignOut} />

      <main className="sn-main sn-scroll" style={{ flex: 1, marginLeft: 232, minHeight: "100vh", overflowY: "auto" }}>
        <div style={{ maxWidth: 880, margin: "0 auto", padding: "24px 20px 40px" }}>
          <BookSwitcher
            books={books}
            activeBook={activeBook}
            currentUid={uid}
            onSelect={selectBook}
            onCreate={createSharedBook}
            onJoin={joinSharedBook}
            onApproveRequest={approveJoinRequest}
            onRejectRequest={rejectJoinRequest}
            onChangeMemberRole={changeMemberRole}
            onRemoveMember={removeMember}
            onLeaveBook={leaveBook}
            onUpdateBookName={updateBookName}
            onUpdateBookPassword={updateBookPassword}
            onDeleteBook={deleteBook}
            getRememberedPassword={getRememberedBookPassword}
          />
          <TopHeader tab={tab} />
          {!booksLoaded || !loaded ? (
            <LoadingState />
          ) : tab === "dashboard" ? (
            <Dashboard transactions={transactions} onSeeAll={() => setTab("summary")} onSeeDay={goToDaily} onAdd={() => setTab("add")} />
          ) : tab === "add" ? (
            canWriteTransactions ? (
              <AddForm onSubmit={handleAdd} savedFlash={savedFlash} />
            ) : (
              <div style={{ border: `1px solid ${T.paperLine}`, borderRadius: 12, padding: 18, background: T.paper }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>คุณมีสิทธิ์ดูอย่างเดียวในสมุดนี้</div>
                <div style={{ color: T.inkSoft, fontSize: 14 }}>เฉพาะ Owner หรือ Editor เท่านั้นที่สามารถบันทึกรายการใหม่ได้</div>
              </div>
            )
          ) : tab === "daily" ? (
            <DailyView transactions={transactions} selectedDate={selectedDate} setSelectedDate={setSelectedDate} onDelete={deleteTransaction} />
          ) : tab === "profile" ? (
            <ProfileView user={userDisplayObj} onSave={updateUserProfile} />
          ) : (
            <SummaryView transactions={transactions} onSeeDay={goToDaily} />
          )}
        </div>
      </main>

      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}
