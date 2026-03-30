'use client';

export const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background pt-24 pb-20">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* Content */}
      <div className="container relative mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">

     {/* Light blue badge on top */}
    <div className="mb-4 md:mb-6">
      <span className="text-2xl font-medium text-blue-500 bg-white-100 px-4 py-1.5 rounded-full">
        Africa's Premier Event Platform
      </span>
    </div>
          <h1 className="font-display text-8xl md:text-8xl font-bold mb-6 leading-tight">
  Discover{' '}
  <div className="inline-block">
    <span className="text-blue-500 block">Unforgettable</span>
    <span className="text-transparent bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text block">
      Experiences
    </span>
  </div>
</h1>
          <p className="text-xl text-muted-foreground mb-8 mx-auto  max-w-xl">
            From music festivals to tech conferences, find and book tickets to the best events happening across Africa.
          </p>
          <div className="flex gap-4 justify-center">
            <button className="px-8 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors">
  Explore Events
</button>
            <button className="px-8 py-3 border border-blue-400 text-blue-600 rounded-lg font-medium hover:text-blue-700 hover:border-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:shadow-blue-400/50 transition-all duration-300">
  Host An Event
</button>
          </div>
        </div>
      </div>
    </section>
  );
};
