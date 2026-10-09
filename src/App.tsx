import { useState } from "react";
import { LogOut } from "lucide-react";
import { T, todayISO } from "./theme";
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
import { DeleteAccountCard } from "./components/DeleteAccount";

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();

  if (authLoading) {
    return <LoadingState label="กำลังตรวจสอบการเข้าสู่ระบบ..." />;
  }

  if (!user) {
    return <Login />;
  }

  return <SignedInApp uid={user.uid} onSignOut={signOut} userDisplayObj={user} />;
}

function SignedInApp({ uid, onSignOut, userDisplayObj }: { uid: string; onSignOut: () => void; userDisplayObj: NonNullable<ReturnType<typeof useAuth>["user"]> }) {
  const { updateUserProfile } = useAuth();
  const { books, activeBook, loaded: booksLoaded, selectBook, createSharedBook, requestJoin, cancelRequest, myRequests, changeMemberRole, removeMember, leaveBook, updateBookName, deleteBook } = useBooks(uid, userDisplayObj);
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
    <div style={{ minHeight: "100vh", display: "flex" }}>
      <Sidebar tab={tab} setTab={setTab} user={userDisplayObj} onSignOut={onSignOut} />

      <main className="sn-main sn-scroll" style={{ flex: 1, minWidth: 0, minHeight: "100vh" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 20px 48px" }}>
          <TopHeader tab={tab} bookName={activeBook?.name} onBookClick={() => setTab("profile")} />
          <div key={`${tab}:${activeBook?.id}`} className="sn-page">
            {!booksLoaded || !loaded ? (
              <LoadingState />
            ) : tab === "dashboard" ? (
              <Dashboard transactions={transactions} onSeeAll={() => setTab("summary")} onSeeDay={goToDaily} onAdd={() => setTab("add")} />
            ) : tab === "add" ? (
              canWriteTransactions ? (
                <AddForm onSubmit={handleAdd} savedFlash={savedFlash} />
              ) : (
                <div className="sn-card" style={{ padding: 20, maxWidth: 640 }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>คุณมีสิทธิ์ดูอย่างเดียวในสมุดนี้</div>
                  <div style={{ color: T.inkSoft, fontSize: 14 }}>เฉพาะ Owner หรือ Editor เท่านั้นที่สามารถบันทึกรายการใหม่ได้</div>
                </div>
              )
            ) : tab === "daily" ? (
              <DailyView transactions={transactions} selectedDate={selectedDate} setSelectedDate={setSelectedDate} onDelete={deleteTransaction} />
            ) : tab === "profile" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 760 }}>
                <BookSwitcher
                  books={books}
                  activeBook={activeBook}
                  currentUid={uid}
                  myRequests={myRequests}
                  onSelect={selectBook}
                  onCreate={createSharedBook}
                  onRequestJoin={requestJoin}
                  onCancelRequest={cancelRequest}
                  onChangeMemberRole={changeMemberRole}
                  onRemoveMember={removeMember}
                  onLeaveBook={leaveBook}
                  onUpdateBookName={updateBookName}
                  onDeleteBook={deleteBook}
                />
                <ProfileView user={userDisplayObj} onSave={updateUserProfile} />
                <DeleteAccountCard user={userDisplayObj} />
                <button
                  onClick={onSignOut}
                  className="sn-mobile-only"
                  style={{ alignItems: "center", gap: 8, background: T.paper, border: `1px solid ${T.paperLine}`, borderRadius: 14, padding: "13px 14px", fontSize: 14.5, color: T.expense, fontWeight: 700, justifyContent: "center" }}
                >
                  <LogOut size={17} /> ออกจากระบบ
                </button>
              </div>
            ) : (
              <SummaryView transactions={transactions} onSeeDay={goToDaily} />
            )}
          </div>
        </div>
      </main>

      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}
