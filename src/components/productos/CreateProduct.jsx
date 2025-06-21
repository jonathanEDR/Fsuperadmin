import React, { useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';

const CreateProduct = ({ onProductCreated, disabled }) => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [formData, setFormData] = useState({
    nombre: '',
    precio: '',
    cantidad: ''
  });
  // ...existing code...
};

export default CreateProduct;
