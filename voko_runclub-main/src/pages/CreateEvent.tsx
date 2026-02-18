import { useState, useRef, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useGooglePlacesAutocomplete } from '@/hooks/useGooglePlacesAutocomplete';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { uploadEventImage, uploadMultipleImages } from '@/lib/supabase-storage';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthSheet } from '@/components/AuthSheet';
import { SEOHead } from '@/components/SEOHead';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ArrowLeft, Upload, MapPin, Calendar as CalendarIcon, Clock, Zap, Plus, Edit3, Trash2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

const eventSchema = z.object({
  eventName: z.string().trim().min(1, 'Event name is required').max(200, 'Event name must be less than 200 characters'),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format (e.g., 15:00)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format (e.g., 16:00)'),
  lumaLink: z.string().url('Invalid URL').optional().or(z.string().length(0)),
  location: z.string().trim().min(1, 'Location is required').max(300, 'Location must be less than 300 characters'),
  description: z.string().trim().min(1, 'Description is required').max(2000, 'Description must be less than 2000 characters'),
});

const CreateEvent = () => {
  const { user, role, loading: authLoading } = useAuth();
  const [eventName, setEventName] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState('');
  const [startPeriod, setStartPeriod] = useState<'AM' | 'PM'>('PM');
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [endTime, setEndTime] = useState('');
  const [endPeriod, setEndPeriod] = useState<'AM' | 'PM'>('PM');
  const [lumaLink, setLumaLink] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [secondaryImages, setSecondaryImages] = useState<{ file: File, preview: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const locationInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { onPlaceSelected } = useGooglePlacesAutocomplete(locationInputRef);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        setShowAuthModal(true);
      } else if (role !== 'admin') {
        toast.error('You do not have admin privileges');
        navigate('/');
      }
    }
  }, [user, role, authLoading, navigate]);

  useEffect(() => {
    onPlaceSelected((place) => {
      const address = place.formatted_address || place.name || '';
      setLocation(address);
    });
  }, [onPlaceSelected]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a JPG, PNG, GIF, or WebP image');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSecondaryImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newImages = files.map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      setSecondaryImages(prev => [...prev, ...newImages]);
    }
  };

  const removeSecondaryImage = (index: number) => {
    setSecondaryImages(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!startDate) {
      toast.error('Please select a start date');
      return;
    }
    if (!endDate) {
      toast.error('Please select an end date');
      return;
    }
    if (!imageFile) {
      toast.error('Please add an event image');
      return;
    }

    const formatTimeTo24h = (time: string, period: 'AM' | 'PM') => {
      let [hours, minutes] = time.split(':');
      let h = parseInt(hours);
      if (period === 'PM' && h < 12) h += 12;
      if (period === 'AM' && h === 12) h = 0;
      return `${h.toString().padStart(2, '0')}:${minutes || '00'}`;
    };

    const startTime24 = formatTimeTo24h(startTime, startPeriod);
    const endTime24 = formatTimeTo24h(endTime, endPeriod);

    const validationResult = eventSchema.safeParse({
      eventName,
      startTime: startTime24,
      endTime: endTime24,
      lumaLink,
      location,
      description,
    });

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    const startDateTime = new Date(startDate);
    const [startHours, startMinutes] = startTime.split(':');
    startDateTime.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);

    const endDateTime = new Date(endDate);
    const [endHours, endMinutes] = endTime.split(':');
    endDateTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);

    if (endDateTime <= startDateTime) {
      toast.error('End date/time must be after start date/time');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload images to Supabase storage
      const publicUrl = await uploadEventImage(imageFile);
      const secondaryUrls = await uploadMultipleImages(secondaryImages.map(img => img.file));

      const targetDate = new Date(startDate);
      const [hours, minutes] = startTime24.split(':');
      targetDate.setHours(parseInt(hours) || 0, parseInt(minutes) || 0);

      const dateStr = format(startDate, 'MMMM dd, yyyy');
      const timeStr = `${startTime} ${startPeriod} - ${endTime} ${endPeriod}`;

      const creatorName = user.displayName || user.email?.split('@')[0] || 'Anonymous';

      await addDoc(collection(db, 'events'), {
        title: eventName,
        description: description,
        date: dateStr,
        time: timeStr,
        luma_link: lumaLink,
        address: location,
        background_image_url: publicUrl,
        secondary_images: secondaryUrls,
        target_date: targetDate.toISOString(),
        creator: creatorName,
        created_by: user.uid,
        created_at: new Date().toISOString()
      });

      toast.success('Event created successfully!');
      navigate('/my-events');
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Error creating event:', error);
      toast.error(error.message || 'Failed to create event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-admin-light-bg dark:bg-admin-dark-bg text-admin-light-text dark:text-admin-dark-text transition-colors duration-500 font-sans overflow-x-hidden selection:bg-admin-light-accent/30 dark:selection:bg-admin-dark-accent/30">
      <SEOHead
        title="DROP NEW VIBE | Admin"
        description="Create a new event in the Voko grid"
      />
      <AuthSheet isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-50 dark:opacity-20">
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-admin-light-accent/20 dark:bg-admin-dark-accent/20 blur-[120px] rounded-full animate-float" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] bg-purple-500/10 blur-[100px] rounded-full animate-pulse" />
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 relative z-10">
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 group text-[10px] font-black uppercase tracking-[0.3em] hover:text-admin-light-accent dark:hover:text-admin-dark-accent transition-colors"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Console
          </motion.button>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Admin Mode</span>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-admin-light-accent dark:bg-admin-dark-accent animate-pulse" />
                <span className="text-[9px] font-bold uppercase tracking-widest">Active</span>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
          {/* Main Info Area */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Title Input - Big & Bold */}
            <div className="relative group">
              <textarea
                placeholder="VIBE NAME..."
                className="w-full bg-transparent text-5xl md:text-6xl font-black italic tracking-tighter focus:outline-none placeholder:text-black/5 dark:placeholder:text-white/5 resize-none leading-none py-2"
                rows={1}
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
              />
              <div className="absolute bottom-0 left-0 w-0 h-1 bg-admin-light-accent dark:bg-admin-dark-accent transition-all duration-700 group-focus-within:w-full opacity-30" />
            </div>

            {/* Main Image Dropzone - Compact but Rich */}
            <div className="relative group overflow-hidden rounded-[2rem] border-2 border-black/5 dark:border-white/5 hover:border-admin-light-accent/50 dark:hover:border-admin-dark-accent/50 transition-all duration-500 shadow-2xl">
              <label className="block w-full aspect-[16/9] bg-black/5 dark:bg-white/5 overflow-hidden cursor-pointer">
                {imagePreview ? (
                  <motion.img 
                    layoutId="main-image"
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                    <div className="p-4 rounded-full bg-admin-light-accent/10 dark:bg-admin-dark-accent/10 text-admin-light-accent dark:text-admin-dark-accent group-hover:rotate-12 transition-transform">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Drop Visual Heat</span>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
              
              {imagePreview && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-4 rounded-2xl bg-white dark:bg-admin-dark-bg text-admin-light-accent dark:text-admin-dark-accent font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:scale-110 transition-transform"
                  >
                    <Edit3 className="w-4 h-4" /> Swap Vibe
                  </button>
                </div>
              )}
            </div>

            {/* Description - Neumorphic Style */}
            <div className="relative group">
              <textarea
                placeholder="DESCRIBE THE ENERGY..."
                rows={4}
                className="w-full bg-black/5 dark:bg-white/5 rounded-[1.5rem] border-2 border-transparent focus:border-admin-light-accent/20 dark:focus:border-admin-dark-accent/20 p-6 font-black text-base focus:outline-none transition-all resize-none shadow-inner"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div className="absolute top-4 right-4 p-2 bg-admin-light-accent/10 dark:bg-admin-dark-accent/10 rounded-lg">
                <Zap className="w-3 h-3 text-admin-light-accent dark:text-admin-dark-accent opacity-40" />
              </div>
            </div>
          </motion.div>

          {/* Sidebar - Quick Config */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6 lg:sticky lg:top-8"
          >
            {/* Intel Card */}
            <div className="bg-black/5 dark:bg-white/5 p-6 rounded-[2rem] border border-black/5 dark:border-white/10 space-y-4 shadow-xl backdrop-blur-xl">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 flex items-center gap-2">
                <Settings className="w-3 h-3" /> Core Intel
              </h3>
              
              {/* Date & Time Grid */}
              <div className="space-y-4">
                {/* Start Info */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Starts</label>
                  <div className="grid grid-cols-[1fr_100px_70px] gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="flex items-center gap-3 p-4 bg-white dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10 text-sm font-black hover:border-admin-light-accent/50 transition-all text-left">
                          <CalendarIcon className="w-4 h-4 text-admin-light-accent dark:text-admin-dark-accent" />
                          {startDate ? format(startDate, "dd MMM") : "Date"}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-3xl border-none shadow-2xl" align="end">
                        <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <input
                      type="text"
                      placeholder="07:00"
                      className="w-full p-4 bg-white dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10 text-sm font-black text-center focus:outline-none focus:border-admin-light-accent/50"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                    <button 
                      onClick={() => setStartPeriod(p => p === 'AM' ? 'PM' : 'AM')}
                      className="p-4 bg-white dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10 text-xs font-black hover:text-admin-light-accent transition-colors"
                    >
                      {startPeriod}
                    </button>
                  </div>
                </div>

                {/* End Info */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2 text-red-400">Ends</label>
                  <div className="grid grid-cols-[1fr_100px_70px] gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="flex items-center gap-3 p-4 bg-white dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10 text-sm font-black hover:border-red-400/50 transition-all text-left">
                          <Clock className="w-4 h-4 text-red-400" />
                          {endDate ? format(endDate, "dd MMM") : "Date"}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-3xl border-none shadow-2xl" align="end">
                        <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <input
                      type="text"
                      placeholder="09:00"
                      className="w-full p-4 bg-white dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10 text-sm font-black text-center focus:outline-none focus:border-red-400/50"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                    <button 
                      onClick={() => setEndPeriod(p => p === 'AM' ? 'PM' : 'AM')}
                      className="p-4 bg-white dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10 text-xs font-black hover:text-red-400 transition-colors"
                    >
                      {endPeriod}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Location Hub</label>
                  <div className="flex items-start gap-3 p-4 bg-white dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10 group focus-within:border-admin-light-accent/50 transition-all">
                    <MapPin className="w-4 h-4 text-admin-light-accent dark:text-admin-dark-accent mt-1" />
                    <textarea
                      ref={locationInputRef as any}
                      placeholder="Search Hub..."
                      rows={2}
                      className="flex-1 bg-transparent text-sm font-black focus:outline-none placeholder:opacity-20 resize-none"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                </div>

                {/* Luma Link */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Luma Registration Link</label>
                  <div className="flex items-center gap-3 p-4 bg-white dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10 group focus-within:border-admin-light-accent/50 transition-all">
                    <Zap className="w-4 h-4 text-admin-light-accent dark:text-admin-dark-accent" />
                    <input
                      type="url"
                      placeholder="https://lu.ma/event-id"
                      className="flex-1 bg-transparent text-sm font-black focus:outline-none placeholder:opacity-20"
                      value={lumaLink}
                      onChange={(e) => setLumaLink(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Quick Gallery Toggle/Preview */}
              <div className="pt-2">
                <label className="text-[9px] font-black uppercase tracking-widest opacity-40 ml-2">Gallery ({secondaryImages.length})</label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {secondaryImages.slice(0, 3).map((img, i) => (
                    <div key={i} className="aspect-square rounded-lg overflow-hidden border border-black/5 dark:border-white/10">
                      <img src={img.preview} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  <label className="aspect-square rounded-lg border-2 border-dashed border-black/10 dark:border-white/10 flex items-center justify-center cursor-pointer hover:border-admin-light-accent transition-colors">
                    <Plus className="w-4 h-4 opacity-40" />
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleSecondaryImagesUpload} />
                  </label>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full h-20 rounded-[2rem] bg-admin-light-accent dark:bg-admin-dark-accent text-white font-black text-xl italic uppercase tracking-tighter hover:scale-[1.02] active:scale-95 transition-all shadow-[0_20px_40px_rgba(0,255,0,0.15)] dark:shadow-[0_20px_40px_rgba(0,255,0,0.25)] disabled:opacity-50 border-none"
            >
              {isSubmitting ? 'Sycn' : 'Drop It'}
              <Zap className="ml-2 w-6 h-6 fill-current animate-pulse" />
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;
