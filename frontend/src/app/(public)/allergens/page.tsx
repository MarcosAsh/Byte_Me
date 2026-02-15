"use client";

export default function LicensePage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-4">Allergens Notice</h1>
      <p className="mb-6 text-gray-600">
        Updated 15/02/26 in line with Natasha's Law(2021) and the Food Information Regulations Act(2014)
      </p>

      <div className="border rounded-lg shadow-inner h-[70vh] overflow-y-scroll p-6 bg-white">
        <div className="prose prose-lg max-w-none space-y-4">
          <h2 className="text-1xl font-bold mb-4">Byte Me allergens notice</h2>
          <p>
            Our bundles will always note if they may contain any of the <strong>14 major allergens</strong>.
            This may be as a known ingredient or if there is a risk of cross contamination.
            The fourteen major allergens are as follows:
          </p>

          <ul className="list-disc pl-6">
            <li>1. Celery</li>
            <li>2. Cereals containing gluten</li>
            <li>3. Crustaceans</li>
            <li>4. Eggs</li>
            <li>5. Fish</li>
            <li>6. Lupin</li>
            <li>7. Milk</li>
            <li>8. Molluscs</li>
            <li>9. Mustard</li>
            <li>10. Tree nuts</li>
            <li>11. Peanuts</li>
            <li>12. Sesame seeds</li>
            <li>13. Soya</li>
            <li>14. Sulphites with 10mg/kg concentration or higher</li>
          </ul>
          <p>
            Any other allergens may not be explicitly listed and <strong>must</strong> be checked yourself.
            For any enquiries visit our support page.
          </p>
        </div>
      </div>
    </main>
  );
}