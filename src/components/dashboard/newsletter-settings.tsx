import { DashboardNewsletterSubscribePanel } from "@/components/dashboard/dashboard-newsletter-subscribe-panel";

export default function NewsletterSettings({
  accountEmail,
}: {
  accountEmail: string;
}) {
  return (
    <section aria-labelledby="newsletter-settings-title">
      <DashboardNewsletterSubscribePanel
        accountEmail={accountEmail}
        showHeader
        titleId="newsletter-settings-title"
      />
    </section>
  );
}
