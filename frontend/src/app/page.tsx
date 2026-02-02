"use client";

import Link from "next/link";
import Popup from 'reactjs-popup';
import { useState, useEffect } from "react";

export default function Home() {

	const [showPopup, setShowPopup] = useState(false);

	const closePopup = () => {
    setShowPopup(false);
	};
	
	useEffect(() => {
    setShowPopup(true);
	}, []);

	return (

		<div className = "page">
			{showPopup && (
				<div className = "popup-overlay" onClick = {closePopup}>
					<div className="modal !bg-green-500 border-white" onClick={(e) => e.stopPropagation()}>
						<button className="close-btn" onClick={closePopup}>
							&times;
						</button>

						<div className = "header text-3xl font-bold mb-4 text-gray-900 text-center">
							Data Safety Notice
						</div>

						<div className="content">
							<p className="mb-4 text-lg text-center">
								Keeping your data safe is very important to us. That's why at Byte Me we will only use the data you provide us for purposes you have agreed to, and will never disclose it to third parties without your consent.
                            </p>
						</div>
					</div>
				</div>
			)}



      {/* 1. HERO SECTION */}
      <section className = "text-center py-12 mb-8">
		<h1 className = "text-5xl font-bold mb-4 text-green-600">
			ByteMe
		</h1>
        <p className = "text-xl font-muted mb-8 max-w-2xl mx-auto">
			Connecting surplus food with people who can actually use it.
        </p>
        <div className = "flex justify-center gap-4">
          <Link href = "/bundles" className = "btn btn-primary">
              Search Bundles
          </Link>
          <Link href = "/register" className = "btn btn-secondary">
              Join as a Seller
          </Link>
        </div>
      </section>

      {/* 2. HOW IT WORKS  */}
      <section className = "mb-16">
        <div className = "text-center mb-8">
          <h2 className = "text-3xl font-bold">How It Works</h2>
          <p className = "text-muted">Three steps to fight food waste.</p>
        </div>
        
        <div className = "grid grid-3">
          <div className = "card text-center">
            <div className = "text-4xl mb-4">🔍</div>
            <h3 className = "text-xl font-bold mb-2">Browse</h3>
            <p className = "text-muted">Discover food bundles near you.</p>
          </div>

          <div className = "card text-center">
            <div className = "text-4xl mb-4">📅</div>
            <h3 className = "text-xl font-bold mb-2">Reserve</h3>
            <p className = "text-muted">Secure your bundle instantly through the app.</p>
          </div>

          <div className = "card text-center">
            <div className = "text-4xl mb-4">🛍️</div>
            <h3 className = "text-xl font-bold mb-2">Pick Up</h3>
            <p className = "text-muted">Show your code at the store, pick up your bag, and enjoy!</p>
          </div>
        </div>
      </section>

      {/* 3. LIVE STATS (We need to integrate with analytics)  */}
      <section className = "mb-16">
        <div className = "card bg-green-50 border-green-200">
          <div className = "grid grid-3 text-center">
            <div>
              <div className = "text-3xl font-bold text-green-600">placeholder</div>
              <div className = "text-muted">Food Saved</div>
            </div>
            <div>
              <div className = "text-3xl font-bold text-green-600">placeholder</div>
              <div className = "text-muted">CO2 Emissions Prevented</div>
            </div>
            <div>
              <div className = "text-3xl font-bold text-green-600">placeholder</div>
              <div className = "text-muted">Money Saved</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. GAMIFICATION  */}
      <section className = "text-center mb-16">
        <h2 className = "text-3xl font-bold mb-4">Show Off When You Save</h2>
        <p className = "text-muted mb-6">Earn badges and maintain streaks for every bundle you rescue.</p>
        
        <div className = "grid grid-3 max-w-4xl mx-auto">
           <div className = "badge badge-warning text-lg py-2 px-4 justify-center">7 Day Streak</div>
           <div className = "badge badge-primary text-lg py-2 px-4 justify-center">Zero Waste</div>
           <div className = "badge badge-warning text-lg py-2 px-4 justify-center">Top Rescuer</div>
        </div>
      </section>


      <section className = "text-center py-12 bg-green-500 rounded-2xl">
        <h2 className = "text-3xl font-bold mb-4">Start saving now!</h2>
        <Link href = "/register" className = "btn btn-primary">
          Create Free Account
        </Link>
      </section>
    </div>
  );
}
