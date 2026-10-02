import AppSidebar from "../app-sidebar";

export default function SettingsLoading() {
  return (
    <main className="dashboard-page settings-page settings-loading">
      <AppSidebar active="settings" />
      <section className="settings-content" aria-label="Loading settings">
        <div className="settings-loading-heading" />
        <div className="settings-loading-section" />
        <div className="settings-loading-section" />
        <div className="settings-loading-section" />
      </section>
    </main>
  );
}