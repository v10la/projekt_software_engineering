import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Datenschutzerklärung | Geschenke-Manager",
  description: "Datenschutzerklärung und Informationen zur Datenverarbeitung",
};

export default function DatenschutzPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Datenschutzerklärung</h1>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">1. Verantwortlicher</h2>
        <p>
          Verantwortlich für die Datenverarbeitung auf dieser Website ist:
          <br />
          Musterfirma GmbH
          <br />
          Musterstraße 123
          <br />
          12345 Musterstadt
          <br />
          E-Mail: datenschutz@musterfirma.de
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">2. Erhebung und Speicherung personenbezogener Daten</h2>
        <p>
          Beim Besuch unserer Website werden automatisch Informationen allgemeiner Natur erfasst. Diese Informationen (Server-Logfiles) beinhalten etwa die Art des Webbrowsers, das verwendete Betriebssystem, den Domainnamen Ihres Internet-Service-Providers und ähnliches. Die Erhebung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">3. Zweck der Datenverarbeitung</h2>
        <p>
          Wir verarbeiten Ihre personenbezogenen Daten, um Ihnen den Geschenke-Manager zur Verfügung zu stellen, Ihre Geschenkideen und Kontakte zu verwalten sowie die Funktionalität der Anwendung zu gewährleisten.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">4. Ihre Rechte</h2>
        <p>
          Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit sowie Widerspruch gegen die Verarbeitung Ihrer personenbezogenen Daten. Sie können sich bei Fragen zum Datenschutz an uns wenden. Außerdem haben Sie das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">5. Speicherdauer</h2>
        <p>
          Personenbezogene Daten werden nur so lange gespeichert, wie es für den jeweiligen Verarbeitungszweck erforderlich ist oder gesetzliche Aufbewahrungsfristen bestehen.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">6. Cookies</h2>
        <p>
          Diese Anwendung verwendet technisch notwendige Cookies für die Sitzungsverwaltung und Authentifizierung. Diese Cookies sind für den Betrieb der Website erforderlich und werden nach Beendigung Ihrer Sitzung gelöscht.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">7. Änderungen</h2>
        <p>
          Wir behalten uns vor, diese Datenschutzerklärung anzupassen, um sie an geänderte Rechtslagen oder bei Änderungen des Dienstes anzupassen.
        </p>
      </section>
    </div>
  );
}
