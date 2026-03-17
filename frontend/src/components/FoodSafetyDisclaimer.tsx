export default function FoodSafetyDisclaimer() {
  return (
    <div
      role="alert"
      style={{
        padding: "0.75rem 1rem",
        borderRadius: "0.5rem",
        border: "1px solid #f59e0b",
        backgroundColor: "#fffbeb",
        fontSize: "0.85rem",
        lineHeight: 1.5,
        color: "#92400e",
      }}
    >
      <p style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
        Food Safety Notice
      </p>
      <p>
        Surplus food bundles are provided on a <strong>consume at your own risk</strong> basis.
        Allergen information is supplied by the seller and may not be complete.
        If you have a food allergy or intolerance, please check directly with the seller before consuming.
        In line with Natasha&apos;s Law (2021), sellers should list all ingredients, but Byte Me
        cannot guarantee the accuracy of this information.
      </p>
    </div>
  );
}
