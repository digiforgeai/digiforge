'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Shield, Save, Loader2, Camera, Mail, AlignLeft } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'

export default function ProfilePage() {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState({ 
    id: '',
    full_name: '', 
    email: '', 
    bio: '', 
    avatar_url: '' 
  })

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile({
          id: user.id,
          full_name: data?.full_name || '',
          email: user.email || '',
          bio: data?.bio || '',
          avatar_url: data?.avatar_url || ''
        })
      }
      setLoading(false)
    }
    getProfile()
  }, [])

 const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Create a promise for the toast to track
    const uploadPromise = async () => {
      const fileExt = file.name.split('.').pop()
      const filePath = `${profile.id}/${Math.random()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
      
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id)

      if (dbError) throw dbError
      
      setProfile({ ...profile, avatar_url: publicUrl })
      return "Avatar updated"
    }

    toast.promise(uploadPromise(), {
      loading: 'Uploading avatar...',
      success: (data) => data,
      error: (err) => `Upload failed: ${err.message}`,
    })
  }

  const handleUpdate = async () => {
    setSaving(true)
    const { error } = await supabase.from('profiles').upsert({
      id: profile.id,
      full_name: profile.full_name,
      bio: profile.bio,
      avatar_url: profile.avatar_url,
      email: profile.email
    })
    
    if (error) {
      toast.error("Critical: " + error.message)
    } else {
      toast.success("Identity updated successfully", {
        description: "Your profile has been updated.",
      })
    }
    setSaving(false)
  }
  
  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>

  return (
    <div className="p-4 md:p-12 max-w-5xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">User <span className="text-indigo-600">Identity</span></h1>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Manage your neural forge profile</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-6">
          {/* Avatar Card */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 text-center shadow-sm">
            <div className="relative w-32 h-32 mx-auto mb-6">
              {profile.avatar_url ? (
                <Image 
                  src={profile.avatar_url} 
                  alt="Avatar" 
                  fill 
                  sizes="(max-width: 768px) 128px, 128px"
                  className="rounded-3xl object-cover border-4 border-slate-50" 
                />
              ) : (
                <div className="w-full h-full bg-indigo-600 rounded-3xl flex items-center justify-center text-4xl font-black text-white uppercase shadow-xl shadow-indigo-200">
                  {profile.full_name[0] || 'U'}
                </div>
              )}
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 bg-slate-900 text-white p-2.5 rounded-xl hover:bg-indigo-600 transition-all cursor-pointer shadow-lg"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleUpload} accept="image/*" />
            </div>
            <h2 className="font-black text-slate-900 uppercase tracking-tight">{profile.full_name || 'Anonymous User'}</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{profile.email}</p>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 md:p-10 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <input
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm text-slate-900 font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bio / Headline</label>
                <input
                  type="text"
                  value={profile.bio}
                  onChange={(e) => setProfile({...profile, bio: e.target.value})}
                  placeholder="Digital marketer, etc..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm text-slate-900 font-bold outline-none focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2 mb-8">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <input 
                type="email" 
                value={profile.email} 
                disabled 
                className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-5 py-4 text-sm text-slate-400 font-bold cursor-not-allowed" 
              />
            </div>

            <button 
              onClick={handleUpdate}
              disabled={saving}
              className="w-full cursor-pointer md:w-auto bg-slate-900 text-white font-black px-10 py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Update Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}