import Header from "../Header/Header.jsx";

export default function Layout({ title, actions, children }) {
  return (
    <div className="page">
      <Header title={title} actions={actions} />
      <main className="container">{children}</main>
    </div>
  );
}
