import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Impressum | Geschenke-Manager",
  description: "Impressum und rechtliche Angaben",
};

export default function ImpressumPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Impressum</h1>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Angaben gemäß § 5 TMG</h2>
        <p>
          Musterfirma GmbH
          <br />
          Musterstraße 123
          <br />
          12345 Musterstadt
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Vertreten durch</h2>
        <p>Max Mustermann (Geschäftsführer)</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Kontakt</h2>
        <p>
          Telefon: +49 (0) 123 456789
          <br />
          E-Mail: info@musterfirma.de
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Registereintrag</h2>
        <p>
          Eintragung im Handelsregister.
          <br />
          Registergericht: Amtsgericht Musterstadt
          <br />
          Registernummer: HRB 12345
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Umsatzsteuer-ID</h2>
        <p>
          Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz:
          <br />
          DE 123456789
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Verantwortlich für den Inhalt</h2>
        <p>
          Max Mustermann
          <br />
          Musterstraße 123
          <br />
          12345 Musterstadt
        </p>
      </section>
    </div>
  );
}
