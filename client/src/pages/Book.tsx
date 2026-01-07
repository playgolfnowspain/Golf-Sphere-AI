import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBookingSchema } from "@shared/schema";
import { useCreateBooking } from "@/hooks/use-content";
import { Loader2, CheckCircle2, Calendar, Clock, Users, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { z } from "zod";

type BookingForm = z.infer<typeof insertBookingSchema>;

export default function Book() {
  const mutation = useCreateBooking();
  
  const form = useForm<BookingForm>({
    resolver: zodResolver(insertBookingSchema),
    defaultValues: {
      playerCount: 2,
    }
  });

  const onSubmit = (data: BookingForm) => {
    mutation.mutate(data);
  };

  if (mutation.isSuccess) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <motion.div 
          initial={{ scale: 0 }} 
          animate={{ scale: 1 }} 
          className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6"
        >
          <CheckCircle2 className="w-10 h-10" />
        </motion.div>
        <h2 className="text-3xl font-bold mb-2">Booking Confirmed!</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          Your tee time has been reserved. You will receive a confirmation email shortly.
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="btn-primary"
        >
          Book Another Round
        </button>
      </div>
    );
  }

  return (
    <div className="container-wide py-12 md:py-20">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* Left Side: Info */}
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">Book Your Tee Time</h1>
            <p className="text-lg text-muted-foreground">
              Secure your spot at Spain's top golf courses. Real-time availability powered by GolfNow.
            </p>
          </div>

          <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
            <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" /> Why book with us?
            </h3>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                <span className="text-sm">Instant confirmation directly from the club house</span>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                <span className="text-sm">No hidden booking fees or credit card charges</span>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                <span className="text-sm">Free cancellation up to 48 hours before play</span>
              </li>
            </ul>
          </div>
          
          <div className="relative h-64 rounded-2xl overflow-hidden shadow-lg">
             <img 
               src="https://pixabay.com/get/g97f162f74ee0961f3f18f8febde477cf24067d67b97cdf776a6b417af4dbd70ad329531f92d02a186476b029e1f537aa41a9478b415460b9022acafacc286bb3_1280.jpg" 
               alt="Golfer putting" 
               className="w-full h-full object-cover"
             />
             <div className="absolute inset-0 bg-black/20" />
             <div className="absolute bottom-4 left-4 text-white font-medium">
                PGA Catalunya Resort
             </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-border/50">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" /> Golf Course
              </label>
              <select 
                {...form.register("courseName")}
                className="w-full p-4 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none"
              >
                <option value="">Select a course</option>
                <option value="Valderrama">Real Club Valderrama</option>
                <option value="Sotogrande">Real Club Sotogrande</option>
                <option value="PGA Catalunya">PGA Catalunya Resort</option>
                <option value="Finca Cortesin">Finca Cortesin</option>
              </select>
              {form.formState.errors.courseName && (
                <p className="text-red-500 text-xs">{form.formState.errors.courseName.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" /> Date
                </label>
                <input 
                  type="date" 
                  {...form.register("playDate")}
                  className="w-full p-4 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
                {form.formState.errors.playDate && (
                  <p className="text-red-500 text-xs">{form.formState.errors.playDate.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" /> Time
                </label>
                <input 
                  type="time" 
                  {...form.register("teeTime")}
                  className="w-full p-4 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
                 {form.formState.errors.teeTime && (
                  <p className="text-red-500 text-xs">{form.formState.errors.teeTime.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Players
              </label>
              <div className="flex gap-4">
                {[1, 2, 3, 4].map((num) => (
                  <label key={num} className="flex-1 cursor-pointer">
                    <input 
                      type="radio" 
                      value={num} 
                      {...form.register("playerCount", { valueAsNumber: true })}
                      className="peer sr-only"
                    />
                    <div className="text-center py-3 rounded-xl border border-input peer-checked:bg-primary peer-checked:text-white peer-checked:border-primary hover:bg-secondary transition-all">
                      {num}
                    </div>
                  </label>
                ))}
              </div>
               {form.formState.errors.playerCount && (
                  <p className="text-red-500 text-xs">{form.formState.errors.playerCount.message}</p>
                )}
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Full Name</label>
                <input 
                  {...form.register("userName")}
                  placeholder="John Doe"
                  className="w-full p-4 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
                 {form.formState.errors.userName && (
                  <p className="text-red-500 text-xs">{form.formState.errors.userName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Email Address</label>
                <input 
                  {...form.register("userEmail")}
                  placeholder="john@example.com"
                  type="email"
                  className="w-full p-4 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
                 {form.formState.errors.userEmail && (
                  <p className="text-red-500 text-xs">{form.formState.errors.userEmail.message}</p>
                )}
              </div>
            </div>

            <button 
              type="submit" 
              disabled={mutation.isPending}
              className="w-full btn-primary h-14 text-lg font-semibold"
            >
              {mutation.isPending ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                "Confirm Booking"
              )}
            </button>
            
            <p className="text-xs text-center text-muted-foreground">
              By confirming, you agree to our Terms of Service. Powered by GolfNow.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
