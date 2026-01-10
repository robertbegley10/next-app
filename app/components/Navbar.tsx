'use client'
import Link from 'next/link'
import React from 'react'
import { useCartData } from '../hooks/useCartHooks'

const Navbar = () => {
  const { itemCount, total } = useCartData()
  
  return (
    <header>
      <div className="navbar bg-base-100 shadow-sm px-4">
        <div className="flex-1">
          <Link href={'/'} className="btn btn-ghost text-xl">Home</Link>
        </div>
        
        <div className="flex-none">
          <Link href={'/products'} className="btn btn-ghost text-xl">Products</Link>
          
          <div className="dropdown dropdown-end mx-2">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
              <div className="indicator">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="badge badge-sm indicator-item">{itemCount}</span>
              </div>
            </div>
            <div tabIndex={0} className="card card-compact dropdown-content bg-base-100 z-[1] mt-3 w-52 shadow-lg">
              <div className="card-body p-4">
                <span className="text-lg font-bold">{itemCount} Items</span>
                <span className="text-info">Subtotal: ${total.toFixed(2)}</span>
                <div className="card-actions mt-2">
                  <Link href="/cart" className="btn btn-primary btn-block btn-sm">View cart</Link>
                </div>
              </div>
            </div>
          </div>

          <div className="dropdown dropdown-end gap-4  mx-2">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full">
                <img
                  alt="User avatar"
                  src="https://cdn-icons-png.flaticon.com/512/1077/1077114.png" 
                />
              </div>
            </div>
            <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow-lg">
              <li><Link href={'/orders'}>Orders</Link></li>
              <li><Link href={'/withdrawls'}>Withdrawls</Link></li>
              <li><a>Logout</a></li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar
