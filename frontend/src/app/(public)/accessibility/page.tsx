"use client";

export default function CookiePage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-4">Accessibility Statement</h1>
      <p className="mb-6 text-gray-600">
        Last updated: February 15, 2026
      </p>

      <div className="border rounded-lg shadow-inner h-[70vh] overflow-y-scroll p-6 bg-white text-gray-900">
        <div className="prose prose-lg max-w-none space-y-4">
          <h2>Accessibility Statement for <span className="basic-information website-name">ByteMe</span></h2>
          <p>
            This is an accessibility statement from <span className="basic-information organization-name">ByteMe</span>.
          </p>
          <h3>Measures to support accessibility</h3>
          <p>
            <span className="basic-information organization-name">ByteMe</span>
            takes the following measures to ensure accessibility of
            <span className="basic-information website-name">ByteMe</span>:
          </p>
          <ul className="organizational-effort accessibility-measures">
            <li>Include accessibility throughout our internal policies.</li>
            <li>Integrate accessibility into our procurement practices.</li>
          </ul>
          <h3>Conformance status</h3>
          <p>
            The <a href="https://www.w3.org/WAI/standards-guidelines/wcag/">Web Content Accessibility Guidelines (WCAG)</a> defines requirements for designers and developers to improve accessibility for people with disabilities. It defines three levels of conformance: Level A, Level AA, and Level AAA.
            <span className="basic-information website-name">ByteMe</span>
            is
            <span className="basic-information conformance-status" data-printfilter="lowercase">partially conformant</span>
            with
            <span className="basic-information conformance-standard"><span data-negate="">WCAG 2.2 level AA</span>.</span>
            <span>
            <span className="basic-information conformance-status">Partially conformant</span>
            means that
            <span className="basic-information conformance-meaning">some parts of the content do not fully conform to the accessibility standard</span>.
          </span>
          </p>
          <h3>Feedback</h3>
          <p>
            We welcome your feedback on the accessibility of
            <span className="basic-information website-name">ByteMe</span>.
            Please let us know if you encounter accessibility barriers on
            <span className="basic-information website-name">ByteMe</span>:
          </p>
          <ul className="basic-information feedback h-card">
            <li className="contact-other p-note">At our website: <a href="https://frontend-production-c253c.up.railway.app/support">https://frontend-production-c253c.up.railway.app/support</a></li>
          </ul>
          <h3>Technical specifications</h3>
          <p>
            Accessibility of
            <span className="basic-information website-name">ByteMe</span>
            relies on the following technologies to work with the particular combination of web browser and any assistive technologies or plugins installed on your computer:
          </p>
          <ul className="technical-information technologies-used">
            <li>HTML</li>
            <li>CSS</li>
            <li>TypeScript</li>
          </ul>
          <p>These technologies are relied upon for conformance with the accessibility standards used.</p>
          <h3>Limitations and alternatives</h3>
          <p>
            Despite our best efforts to ensure accessibility of
            <span className="basic-information website-name">ByteMe</span> , there may be some limitations. Below is a description of known limitations, and potential solutions. Please contact us if you observe an issue not listed below.
          </p>
          <p>
            Known limitations for
            <span className="basic-information website-name">ByteMe</span>:
          </p>
          <ol className="technical-information accessibility-limitations">
            <li><strong>All pages</strong>: Text to speech page reader not implemented because It is not included in this iteration of the website. We plan to implement in the next iteration. .</li>
          </ol>
          <h3>Assessment approach</h3>
          <p>
            <span className="basic-information organization-name">ByteMe</span>
            assessed the accessibility of
            <span className="basic-information website-name">ByteMe</span>
            by the following approaches:
          </p>
          <ul className="technical-information assessment-approaches">
            <li>Self-evaluation</li>
          </ul>
          <h3>Formal complaints</h3>
          <p className="complaints">We plan to implement issue forums in the next iteration of this website</p>
        </div>
      </div>
    </main>
  );
}
