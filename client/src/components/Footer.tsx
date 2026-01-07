import { Link } from "wouter";
import { Globe, Twitter, Instagram, Facebook, Mail } from "lucide-react";
import { NewsletterSignup } from "./NewsletterSignup";

export function Footer() {
  return (
    <footer className="bg-secondary/30 border-t border-border mt-20 pt-16 pb-8">
      <div className="container-wide">
        {/* Newsletter Section */}
        <div className="mb-16">
          <NewsletterSignup variant="inline" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold font-display tracking-tight">
                PlayGolfSpainNow
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Discover the finest golf courses in Spain. AI-powered bookings, curated articles, and expert podcasts for the modern golfer.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Explore</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/articles" className="hover:text-primary transition-colors">Articles</Link></li>
              <li><Link href="/podcasts" className="hover:text-primary transition-colors">Podcasts</Link></li>
              <li><Link href="/book" className="hover:text-primary transition-colors">Book Tee Time</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact & Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a 
                  href="mailto:playgolfnowspain@gmail.com" 
                  className="hover:text-primary transition-colors flex items-center gap-2"
                >
                  <Mail className="w-3 h-3" />
                  Contact Us
                </a>
              </li>
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Cookie Policy</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Connect</h4>
            <div className="space-y-3">
              <a 
                href="mailto:playgolfnowspain@gmail.com" 
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
              >
                <Mail className="w-4 h-4" />
                <span>playgolfnowspain@gmail.com</span>
              </a>
              <div className="flex gap-4 pt-2">
                <a href="#" className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all shadow-sm">
                  <Twitter className="w-4 h-4" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all shadow-sm">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all shadow-sm">
                  <Facebook className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <div className="flex flex-col gap-1">
            <p>&copy; {new Date().getFullYear()} PlayGolfSpainNow. All rights reserved.</p>
            <a 
              href="mailto:playgolfnowspain@gmail.com" 
              className="hover:text-primary transition-colors"
            >
              playgolfnowspain@gmail.com
            </a>
          </div>
          <div className="flex gap-2 items-center">
            <span>Powered by GolfNow</span>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          </div>
        </div>
      </div>
    </footer>
  );
}
