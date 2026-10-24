import React, { useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

const API = 'http://YOUR_COMPUTER_LAN_IP:4000/api'; // Replace with deployed HTTPS API URL for production.
export default function App() {
  const [form, setForm] = useState({ username: '', password: '', totp: '' });
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  const [records, setRecords] = useState([]);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  async function request(path, options={}) {
    const response = await fetch(API+path,{...options,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{}),...(options.headers||{})}});
    const data = await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(data.error||'Request failed');
    return data;
  }
  async function login() {
    setBusy(true);
    try { const data=await request('/auth/login',{method:'POST',body:JSON.stringify(form)}); setToken(data.token); setUser(data.user); await AsyncStorage.setItem('projectTwoToken',data.token); await loadRecords(data.token); }
    catch(e){Alert.alert('Sign-in failed',e.message)} finally{setBusy(false)}
  }
  async function loadRecords(currentToken=token) {
    try { const response=await fetch(API+'/records',{headers:{Authorization:'Bearer '+currentToken}}); const data=await response.json(); if(response.ok)setRecords(data.records||[]); else Alert.alert('Could not load records',data.error||'Request failed'); }
    catch(e){Alert.alert('Connection problem','Check the API address and ensure your phone and server can reach each other.')}
  }
  async function addRecord() {
    try { await request('/records',{method:'POST',body:JSON.stringify({title,category,details:''})}); setTitle('');setCategory('');await loadRecords(); }
    catch(e){Alert.alert('Could not save record',e.message)}
  }
  async function logout(){await AsyncStorage.removeItem('projectTwoToken');setToken('');setUser(null);setRecords([])}
  return <SafeAreaView style={s.safe}><StatusBar style="dark"/><ScrollView contentContainerStyle={s.page}><Text style={s.kicker}>SECURE WORKSPACE</Text><Text style={s.heading}>Project Two</Text><Text style={s.sub}>Records and administration, on the go.</Text>{!token?<View style={s.card}><Text style={s.title}>Sign in</Text><TextInput style={s.input} placeholder="Username" autoCapitalize="none" value={form.username} onChangeText={v=>setForm({...form,username:v})}/><TextInput style={s.input} placeholder="Password" secureTextEntry value={form.password} onChangeText={v=>setForm({...form,password:v})}/><TextInput style={s.input} placeholder="6-digit authenticator code" keyboardType="number-pad" maxLength={6} value={form.totp} onChangeText={v=>setForm({...form,totp:v.replace(/\D/g,'')})}/><Pressable style={s.button} onPress={login} disabled={busy}>{busy?<ActivityIndicator color="#fff"/>:<Text style={s.buttonText}>Sign in securely</Text>}</Pressable><Text style={s.note}>Multi-factor authentication must be enrolled first.</Text></View>:<><View style={s.card}><Text style={s.title}>Welcome, {user?.username}</Text><Text style={s.sub}>{user?.role}</Text><Pressable style={s.secondary} onPress={loadRecords}><Text style={s.secondaryText}>Refresh records</Text></Pressable><Pressable style={s.secondary} onPress={logout}><Text style={s.secondaryText}>Sign out</Text></Pressable></View><View style={s.card}><Text style={s.title}>Add record</Text><TextInput style={s.input} placeholder="Record title" value={title} onChangeText={setTitle}/><TextInput style={s.input} placeholder="Category" value={category} onChangeText={setCategory}/><Pressable style={s.button} onPress={addRecord}><Text style={s.buttonText}>Save record</Text></Pressable></View><Text style={s.title}>Records ({records.length})</Text>{records.map(r=><View key={String(r.id)} style={s.record}><Text style={s.recordTitle}>{r.title}</Text><Text style={s.sub}>{r.category} · {r.status}</Text></View>)}</>}</ScrollView></SafeAreaView>
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:'#f4f7fa'},page:{padding:22,paddingTop:36},kicker:{fontSize:11,letterSpacing:2,color:'#26776f',fontWeight:'800'},heading:{fontSize:34,fontWeight:'800',color:'#142f48',marginTop:8},sub:{fontSize:14,color:'#778797',marginTop:6,marginBottom:16},card:{backgroundColor:'#fff',borderRadius:18,padding:18,marginTop:16,borderWidth:1,borderColor:'#e5ebf1'},title:{fontSize:19,fontWeight:'800',color:'#1b344b',marginBottom:12},input:{borderWidth:1,borderColor:'#dce4eb',borderRadius:10,padding:13,marginBottom:12,backgroundColor:'#fff'},button:{backgroundColor:'#176c64',borderRadius:10,padding:14,alignItems:'center',marginTop:3},buttonText:{color:'#fff',fontWeight:'800'},note:{fontSize:12,color:'#8b98a5',lineHeight:18,marginTop:14},secondary:{padding:12,borderWidth:1,borderColor:'#dce4eb',borderRadius:9,alignItems:'center',marginTop:8},secondaryText:{color:'#25485e',fontWeight:'700'},record:{backgroundColor:'#fff',borderRadius:12,padding:15,marginTop:10,borderWidth:1,borderColor:'#e5ebf1'},recordTitle:{fontSize:15,fontWeight:'700',color:'#203b50'}});
