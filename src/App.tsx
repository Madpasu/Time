import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TimerIcon } from 'lucide-react';
import { CreateCapsule } from './components/CreateCapsule';
import { CapsuleList } from './components/CapsuleList';
import { ViewCapsule } from './components/ViewCapsule';
import { useAvailableCapsules } from './hooks/useAvailableCapsules';

export function App() {
  const { capsules, loading, refetch } = useAvailableCapsules();

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-purple-900">
        <div className="container mx-auto px-4 py-8">
          <header className="mb-8 flex items-center">
            <div className="flex items-center gap-2 text-white">
              <TimerIcon className="w-8 h-8" />
              <h1 className="text-3xl font-bold">TimeCapsule</h1>
            </div>
          </header>

          <Routes>
            <Route
              path="/"
              element={
                <div className="max-w-2xl mx-auto space-y-8">
                  <section>
                    <CreateCapsule onSuccess={refetch} />
                  </section>

                  <section>
                    <CapsuleList capsules={capsules} loading={loading} onDelete={refetch} />
                  </section>
                </div>
              }
            />
            <Route path="/view/:id" element={<ViewCapsule />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;