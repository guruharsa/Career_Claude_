export default function Profile({ profile, setProfile }) {
  return (
    <div className="panel">
      <h2>Your profile</h2>
      <label>Name</label>
      <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
      <label>Target role</label>
      <input value={profile.role} onChange={(e) => setProfile({ ...profile, role: e.target.value })} />
      <label>Location</label>
      <input value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} />
    </div>
  );
}
