import React from 'react'

export default function Sales() {
  return (
    <div className="relative flex flex-col transition-all duration-300">
     

      {/* MAIN CONTENT */}
      <div className="flex-1 p-4 sm:p-6 bg-neutral-lightBg dark:bg-neutral-darkBg text-neutral-lightText dark:text-neutral-darkText min-h-screen transition-colors duration-300">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-center sm:text-left">
            Invoices 
          </h1>
          
          <div>

           
          </div>

         
        </div>
          <div className='border border-black  w-[75%]'>
            <div className='flex items-center w-[100%]'>
              <div className='w-1/2 border-r-0 border  border-t-0 border-l-0 border-black p-2  h-[150px]'>
              <div className='text-[30px] font-bold text-[#f47629]'>Kihaan Enterprises</div>
              <div className='text-[14px]'>Prem Complex, 27 B, Haridwar Rd,
<br />
Dehradun, Uttarakhand 248001
<br />
GST No: 05ATTPN0666K1Z5<br />
PAN No: 05ATTPN0666K1Z5</div>
              </div>
              <div className='w-1/2  border border-r-0 border-t-0 border-black p-2  h-[150px]'>
              
              <div className='text-[18px] font-semibold'>TAX INVOICE</div>
               <div className='text-[14px]'>Invoice No: 121212</div>
               <div className='text-[14px]'>Email Id: choubeyjeet2580@gmail.com</div>
               <div className='text-[14px]'>Website: https://www.kihaanenterprises.com</div>
                <div className='text-[14px]'>Phone No: 8447594486</div>
              </div>
            </div>
            <div className='flex items-center w-[100%]'>
              <div className='w-1/2 border-t-0  border-r-0 border-l-0  border border-black p-2  h-[150px]'>
             <div className='text-[18px] font-semibold'>BILL TO</div>
                <div className='text-[14px]'>Invoice No: 121212</div>
               <div className='text-[14px]'>Email Id: choubeyjeet2580@gmail.com</div>
               <div className='text-[14px]'>Website: https://www.kihaanenterprises.com</div>
                <div className='text-[14px]'>Phone No: 8447594486</div>
              </div>
              <div className='w-1/2 border-t-0 border-r-0 border border-black p-2  h-[150px]'>
              
              <div className='text-[18px] font-semibold'>SHIP TO</div>
               <div className='text-[14px]'>Invoice No: 121212</div>
               <div className='text-[14px]'>Email Id: choubeyjeet2580@gmail.com</div>
               <div className='text-[14px]'>Website: https://www.kihaanenterprises.com</div>
                <div className='text-[14px]'>Phone No: 8447594486</div>
              </div>
            </div>

            <div className='flex bg-[#f47629] w-[100%] text-white gap-10 p-2'>
            <div className='w-[10%]'>S No.</div>
            <div className='w-[30%]'>Item</div>
            <div className='w-[5%]'>Modal</div>
            <div className='w-[5%]'>Price</div>
             <div className='w-[5%]'>Quantity</div>
            <div className='w-[5%]'>GST%</div>
            <div className='w-[15%]'>GST Amount</div>
            <div className='w-[10%]'>Total</div>
            </div>
             <div className='flex w-[100%] text-black gap-10 p-2'>
            <div className='w-[10%]'>1</div>
            <div className='w-[30%]'>CCTVE</div>
            <div className='w-[5%]'>1245</div>
            <div className='w-[5%]'>12</div>
             <div className='w-[5%]'>245</div>
            <div className='w-[5%]'>155</div>
            <div className='w-[15%]'>1545</div>
            <div className='w-[10%]'>1545</div>


            </div>
             <div className="flex w-full text-black gap-10 p-2 border-t border-black">

            <div className='w-[10%]'>2</div>
            <div className='w-[30%]'>CCTVE</div>
            <div className='w-[5%]'>1245</div>
            <div className='w-[5%]'>12</div>
             <div className='w-[5%]'>245</div>
            <div className='w-[5%]'>155</div>
            <div className='w-[15%]'>1545</div>
            <div className='w-[10%]'>1545</div>


            </div>
            </div>
          </div>
            
       
        </div>
  )
}
