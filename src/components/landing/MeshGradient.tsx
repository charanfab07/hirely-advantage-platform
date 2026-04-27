/**
 * Animated fluid mesh gradient background.
 * Fixed full-screen, sits behind all content.
 */
export const MeshGradient = () => {
  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 overflow-hidden"
      style={{ backgroundColor: "hsl(var(--pearl))" }}
    >
      {/* Ethereal blue */}
      <div
        className="absolute -top-[20%] -left-[15%] w-[70vw] h-[70vw] rounded-full opacity-90 animate-orb-1"
        style={{
          background:
            "radial-gradient(circle at center, hsl(var(--ethereal-blue) / 0.95) 0%, hsl(var(--ethereal-blue) / 0) 65%)",
          filter: "blur(80px)",
        }}
      />
      {/* Soft lilac */}
      <div
        className="absolute top-[10%] -right-[15%] w-[65vw] h-[65vw] rounded-full opacity-90 animate-orb-2"
        style={{
          background:
            "radial-gradient(circle at center, hsl(var(--soft-lilac) / 0.95) 0%, hsl(var(--soft-lilac) / 0) 65%)",
          filter: "blur(90px)",
        }}
      />
      {/* Warm blush */}
      <div
        className="absolute top-[40%] left-[10%] w-[60vw] h-[60vw] rounded-full opacity-80 animate-orb-3"
        style={{
          background:
            "radial-gradient(circle at center, hsl(var(--warm-blush) / 0.9) 0%, hsl(var(--warm-blush) / 0) 65%)",
          filter: "blur(100px)",
        }}
      />
      {/* Dawn orange */}
      <div
        className="absolute bottom-[-20%] right-[5%] w-[70vw] h-[70vw] rounded-full opacity-85 animate-orb-4"
        style={{
          background:
            "radial-gradient(circle at center, hsl(var(--dawn-orange) / 0.95) 0%, hsl(var(--dawn-orange) / 0) 65%)",
          filter: "blur(110px)",
        }}
      />
      {/* Grain */}
      <div className="grain" />
    </div>
  );
};
