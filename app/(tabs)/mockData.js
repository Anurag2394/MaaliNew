const mockOrders = [
    {
      id: '1',
      date: '2025-01-25',
      status: 'Delivered',
      items: [
        { name: 'Snake Plant', quantity: 1, price: '$25' },
        { name: 'Aloe Vera', quantity: 2, price: '$30' },
      ],
    },
    {
      id: '2',
      date: '2025-01-15',
      status: 'Pending',
      items: [
        { name: 'Peace Lily', quantity: 1, price: '$30' },
      ],
    },
    {
      id: '3',
      date: '2025-01-05',
      status: 'Cancelled',
      items: [
        { name: 'Fiddle Leaf Fig', quantity: 1, price: '$50' },
      ],
    },
  ];
  
  const mockWallet = '$500';
  const mockPhoneNumber = '+123 456 7890';
  const mockAddresses = [
    { id: '1', address: '123 Main St, New York, NY 10001' },
    { id: '2', address: '456 Oak Ave, Los Angeles, CA 90001' },
  ];

  
  export default mockOrders