import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

function EditItem() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    itam_no: "",
    itam_name: "",
    price_per_one: "",
    quantity: ""
  });

  const [loading, setLoading] = useState(true);

  // Load item data
  useEffect(() => {
    axios
      .get(`http://localhost:5000/itam/${id}`)
      .then((res) => {
        setFormData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to load item");
      });
  }, [id]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.put(`http://localhost:5000/itam/${id}`, formData);
      navigate("/itam-management");
    } catch (err) {
      console.error(err);
      alert("Update failed");
    }
  };

  if (loading) return <h2>Loading...</h2>;

  return (
    <div style={{ maxWidth: "400px", margin: "auto" }}>
      <h2>Edit Item</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="itam_no"
          value={formData.itam_no}
          onChange={handleChange}
          placeholder="Item No"
          required
        />

        <input
          type="text"
          name="itam_name"
          value={formData.itam_name}
          onChange={handleChange}
          placeholder="Item Name"
          required
        />

        <input
          type="number"
          name="price_per_one"
          value={formData.price_per_one}
          onChange={handleChange}
          placeholder="Price"
          required
        />

        <input
          type="number"
          name="quantity"
          value={formData.quantity}
          onChange={handleChange}
          placeholder="Quantity"
          required
        />

        <button type="submit">Update</button>
        <button type="button" onClick={() => navigate("/itam-management")}>
          Cancel
        </button>
      </form>
    </div>
  );
}

export default EditItem;
