import { useState, useRef, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useGooglePlacesAutocomplete } from '@/hooks/useGooglePlacesAutocomplete';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { uploadEventImage, uploadMultipleImages } from '@/lib/supabase-storage';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthSheet } from '@/components/AuthSheet';
import { SEOHead } from '@/components/SEOHead';
import { Trash2, ArrowLeft, Upload, MapPin, Calendar as CalendarIcon, Clock, Zap, Edit3, Users, Plus } from 'lucide-react';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';

const eventSchema = z.object({
  eventName: z.string().trim().min(1, 'Event name is required').max(200, 'Event name must be less than 200 characters'),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format (e.g., 15:00)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format (e.g., 16:00)'),
  lumaLink: z.string().url('Invalid URL').optional().or(z.string().length(0)),
  location: z.string().trim().min(1, 'Location is required').max(300, 'Location must be less than 300 characters'),
  description: z.string().trim().min(1, 'Description is required').max(2000, 'Description must be less than 2000 characters'),
});

const EditEvent = () => {
  const { id } = useParams();
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
  const [existingSecondaryImages, setExistingSecondaryImages] = useState<string[]>([]);
  const [newSecondaryImages, setNewSecondaryImages] = useState<{ file: File, preview: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [registrants, setRegistrants] = useState<Array<{ display_name: string; registered_at: string }>>([]);

  const locationInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
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
    if (user && id) {
      fetchEvent();
    }
  }, [user, id]);

  useEffect(() => {
    onPlaceSelected((place) => {
      const address = place.formatted_address || place.name || '';
      setLocation(address);
    });
  }, [onPlaceSelected]);

  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [eventName]);

  const fetchEvent = async () => {
    try {
      if (!id) return;
      const eventRef = doc(db, 'events', id);
      const eventSnap = await getDoc(eventRef);

      if (!eventSnap.exists()) {
        toast.error('Event not found');
        navigate('/my-events');
        return;
      }

      const data = eventSnap.data();

      // Check if user is the creator
      if (data.created_by !== user?.uid) {
        toast.error('You do not have permission to edit this event');
        navigate('/my-events');
        return;
      }

      setEventName(data.title);
      setDescription(data.description);
      setLocation(data.address);
      setImagePreview(data.background_image_url);
      setExistingSecondaryImages(data.secondary_images || []);

      const targetDate = new Date(data.target_date);
      setStartDate(targetDate);

      const [fullStart, fullEnd] = (data.time || '').split(' - ');
      
      const parseTimeAndPeriod = (timeStr: string) => {
        if (!timeStr) return { time: '', period: 'PM' as const };
        const parts = timeStr.trim().split(' ');
        return {
          time: parts[0] || '',
          period: (parts[1] === 'AM' ? 'AM' : 'PM') as 'AM' | 'PM'
        };
      };

      const startInfo = parseTimeAndPeriod(fullStart);
      const endInfo = parseTimeAndPeriod(fullEnd);

      setStartTime(startInfo.time);
      setStartPeriod(startInfo.period);
      setEndTime(endInfo.time);
      setEndPeriod(endInfo.period);
      setLumaLink(data.luma_link || '');
      setEndDate(targetDate);

      await fetchRegistrants();
      setLoading(false);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching event:', error);
      toast.error('Failed to load event');
      navigate('/my-events');
    }
  };

  const fetchRegistrants = async () => {
    try {
      if (!id) return;
      const q = query(
        collection(db, 'event_registrations'),
        where('event_id', '==', id)
      );
      const querySnapshot = await getDocs(q);

      const registrantsData: any[] = [];
      // Sort manually in memory to avoid needing a composite index for now
      const docs = querySnapshot.docs.sort((a, b) => {
        const dateA = new Date(a.data().registered_at).getTime();
        const dateB = new Date(b.data().registered_at).getTime();
        return dateB - dateA;
      });

      for (const d of docs) {
        const reg = d.data();
        // Fetch user data from user_roles or a profiles collection
        const userRef = doc(db, 'user_roles', reg.user_id);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();

        registrantsData.push({
          display_name: userData?.email?.split('@')[0] || 'Anonymous',
          registered_at: reg.registered_at
        });
      }
      setRegistrants(registrantsData);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching registrants:', error);
    }
  };

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
      setNewSecondaryImages(prev => [...prev, ...newImages]);
    }
  };

  const removeExistingSecondaryImage = (index: number) => {
    setExistingSecondaryImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewSecondaryImage = (index: number) => {
    setNewSecondaryImages(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!user || !id) return;

    if (!startDate || !endDate) {
      toast.error('Please select start and end dates');
      return;
    }

    const formatTimeTo24h = (time: string, period: 'AM' | 'PM') => {
      if (!time) return "00:00";
      let [hours, minutes] = time.split(':');
      let h = parseInt(hours) || 0;
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
      toast.error(validationResult.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = imagePreview;

      if (imageFile) {
        imageUrl = await uploadEventImage(imageFile);
      }

      const newSecondaryUrls = await uploadMultipleImages(newSecondaryImages.map(img => img.file));
      const allSecondaryImages = [...existingSecondaryImages, ...newSecondaryUrls];

      const targetDate = new Date(startDate);
      const [hours, minutes] = startTime24.split(':');
      targetDate.setHours(parseInt(hours) || 0, parseInt(minutes) || 0);

      // Explicitly calculate end date target for validation/sorting if needed
      const targetEndDate = new Date(endDate);
      const [endHours, endMinutes] = endTime24.split(':');
      targetEndDate.setHours(parseInt(endHours) || 0, parseInt(endMinutes) || 0);

      const dateStr = format(startDate, 'MMMM dd, yyyy');
      const timeStr = `${startTime} ${startPeriod} - ${endTime} ${endPeriod}`;

      const eventRef = doc(db, 'events', id);
      const updateData = {
        title: eventName,
        description: description,
        date: dateStr,
        time: timeStr,
        luma_link: lumaLink,
        address: location,
        background_image_url: imageUrl,
        secondary_images: allSecondaryImages,
        target_date: targetDate.toISOString(),
        target_end_date: targetEndDate.toISOString(),
        updated_at: new Date().toISOString()
      };

      if (import.meta.env.DEV) console.log('Updating event with data:', updateData);
      
      await updateDoc(eventRef, updateData);

      toast.success('Event updated successfully!');
      navigate('/my-events');
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Error updating event:', error);
      toast.error(error.message || 'Failed to update event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!id || !window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'events', id));
      toast.success('Event deleted successfully');
      navigate('/my-events');
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-admin-light-bg dark:bg-admin-dark-bg flex items-center justify-center">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-16 h-16 border-4 border-admin-light-accent dark:border-admin-dark-accent border-t-transparent rounded-full shadow-[0_0_20px_rgba(0,255,0,0.5)]"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-admin-light-bg dark:bg-admin-dark-bg text-admin-light-text dark:text-admin-dark-text transition-colors duration-500 font-sans">
      <SEOHead
        title="REFINE VIBE | Admin"
        description="Update event details in the Voko grid"
      />
      <AuthSheet isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="flex justify-between items-center mb-16">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 group text-sm font-bold uppercase tracking-widest"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Console
          </motion.button>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </header>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left: Visuals & Intel */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            <div className="relative group">
              <label className="block w-full aspect-[4/3] border-2 border-black/10 dark:border-white/10 rounded-[2.5rem] bg-black/5 dark:bg-white/5 overflow-hidden cursor-pointer hover:border-admin-light-accent dark:hover:border-admin-dark-accent transition-all duration-500">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                    <div className="p-4 rounded-3xl bg-admin-light-accent/10 dark:bg-admin-dark-accent/10 text-admin-light-accent dark:text-admin-dark-accent">
                      <Upload className="w-8 h-8" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-[0.2em]">Add Main Image</span>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
              {imagePreview && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-6 right-6 p-4 rounded-2xl bg-white dark:bg-admin-dark-bg border border-black/10 dark:border-white/10 shadow-2xl hover:scale-110 transition-transform"
                >
                  <Edit3 className="w-5 h-5 text-admin-light-accent dark:text-admin-dark-accent" />
                </button>
              )}
            </div>

            {/* Registrants Section */}
            {registrants.length > 0 && (
              <div className="bg-black/5 dark:bg-white/5 p-8 rounded-[2.5rem] border border-black/5 dark:border-white/10">
                <div className="flex items-center gap-3 mb-6">
                  <Users className="w-5 h-5 text-admin-light-accent dark:text-admin-dark-accent" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Active Squad ({registrants.length})</h3>
                </div>
                <div className="space-y-3">
                  {registrants.map((registrant, index) => (
                    <div key={index} className="flex justify-between items-center p-4 bg-white dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/10">
                      <span className="font-bold text-sm">{registrant.display_name}</span>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {format(new Date(registrant.registered_at), 'MMM d')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Right: Controls */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="relative group">
              <input
                type="text"
                placeholder="EVENT NAME"
                className="w-full bg-transparent text-5xl md:text-6xl font-black italic tracking-tighter focus:outline-none placeholder:text-black/10 dark:placeholder:text-white/10"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
              />
              <div className="absolute bottom-0 left-0 w-0 h-1 bg-admin-light-accent dark:bg-admin-dark-accent transition-all duration-700 group-focus-within:w-full opacity-30" />
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Starts</label>
                  <div className="grid grid-cols-[1fr_100px_70px] gap-2">
                    <div className="p-4 bg-white dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10 flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-admin-light-accent dark:text-admin-dark-accent">
                        <CalendarIcon className="w-3 h-3" />
                        <span className="text-[8px] font-black uppercase tracking-widest">Date</span>
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="text-sm font-black text-left hover:text-admin-light-accent dark:hover:text-admin-dark-accent transition-colors">
                            {startDate ? format(startDate, "dd MMM") : "Select Date"}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-3xl border-none shadow-2xl" align="start">
                          <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <input
                      type="text"
                      placeholder="07:00"
                      className="w-full p-4 bg-white dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10 text-sm font-black text-center focus:outline-none focus:border-admin-light-accent/50"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                    <button 
                      type="button"
                      onClick={() => setStartPeriod(p => p === 'AM' ? 'PM' : 'AM')}
                      className="p-4 bg-white dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10 text-xs font-black hover:text-admin-light-accent transition-colors"
                    >
                      {startPeriod}
                    </button>
                  </div>

                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2 text-red-400">Ends</label>
                  <div className="grid grid-cols-[1fr_100px_70px] gap-2">
                    <div className="p-4 bg-white dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10 flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-red-400">
                        <Clock className="w-3 h-3" />
                        <span className="text-[8px] font-black uppercase tracking-widest">Date</span>
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="text-sm font-black text-left hover:text-red-400 transition-colors">
                            {endDate ? format(endDate, "dd MMM") : "Select Date"}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-3xl border-none shadow-2xl" align="start">
                          <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <input
                      type="text"
                      placeholder="09:00"
                      className="w-full p-4 bg-white dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10 text-sm font-black text-center focus:outline-none focus:border-red-400/50"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                    <button 
                      type="button"
                      onClick={() => setEndPeriod(p => p === 'AM' ? 'PM' : 'AM')}
                      className="p-4 bg-white dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10 text-xs font-black hover:text-red-400 transition-colors"
                    >
                      {endPeriod}
                    </button>
                  </div>
                </div>

                <div className="p-6 bg-white dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/10 flex items-start gap-4 group focus-within:border-admin-light-accent/50 transition-all">
                  <div className="p-3 rounded-xl bg-admin-light-accent/10 dark:bg-admin-dark-accent/10 text-admin-light-accent dark:text-admin-dark-accent mt-1">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <textarea
                    ref={locationInputRef as any}
                    placeholder="HUB LOCATION"
                    rows={2}
                    className="flex-1 bg-transparent font-black text-lg focus:outline-none placeholder:opacity-20 resize-none py-2"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                {/* Luma Link */}
                <div className="p-6 bg-white dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/10 flex items-center gap-4 group focus-within:border-admin-light-accent/50 transition-all">
                  <div className="p-3 rounded-xl bg-admin-light-accent/10 dark:bg-admin-dark-accent/10 text-admin-light-accent dark:text-admin-dark-accent">
                    <Zap className="w-5 h-5" />
                  </div>
                  <input
                    type="url"
                    placeholder="LUMA REGISTRATION LINK"
                    className="flex-1 bg-transparent font-black text-lg focus:outline-none placeholder:opacity-20"
                    value={lumaLink}
                    onChange={(e) => setLumaLink(e.target.value)}
                  />
                </div>

              <textarea
                placeholder="REFINE THE VIBE..."
                rows={6}
                className="w-full bg-black/5 dark:bg-white/5 rounded-[2rem] border border-black/5 dark:border-white/10 p-8 font-black text-base focus:outline-none focus:border-admin-light-accent/20 dark:focus:border-admin-dark-accent/20 transition-all resize-none shadow-inner"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <div className="flex gap-4">
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 h-20 rounded-[2rem] bg-admin-light-accent dark:bg-admin-dark-accent text-white font-black text-xl italic uppercase tracking-tighter hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-50"
                >
                  {isSubmitting ? 'Syncing...' : 'Update Vibe'}
                  <Zap className="ml-2 w-6 h-6 fill-current" />
                </Button>
                <button
                  onClick={handleDeleteEvent}
                  className="w-20 h-20 rounded-[2rem] bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border-2 border-red-500/20 hover:border-red-500 flex items-center justify-center transition-all group"
                  aria-label="Delete event"
                >
                  <Trash2 className="w-6 h-6 transition-transform group-hover:scale-110" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default EditEvent;
