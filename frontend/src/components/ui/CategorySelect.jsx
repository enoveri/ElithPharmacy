import React, { useState, useEffect, useRef } from 'react';
import { FiChevronDown, FiPlus, FiCheck, FiX, FiSearch } from 'react-icons/fi';
import { dataService } from '../../services';

const CategorySelect = ({
  value,
  onChange,
  error,
  placeholder = "Select or create category",
  required = false,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowCreateForm(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await dataService.categories.getAll();
      // Handle both string arrays and object arrays
      const categoryNames = data.map(cat => 
        typeof cat === 'string' ? cat : cat.name || cat.category_name || cat
      );
      setCategories([...new Set(categoryNames)].filter(Boolean));
    } catch (error) {
      console.error('Error loading categories:', error);
      // Fallback to default categories
      setCategories([
        'Pain Relief',
        'Antibiotics', 
        'Vitamins & Supplements',
        'Cold & Flu',
        'Digestive Health',
        'Heart & Blood Pressure',
        'Diabetes Care',
        'Skin Care',
        'Eye Care',
        'Other'
      ]);
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      setCreating(true);
      
      // Create new category in database
      const newCategory = await dataService.categories.create({
        name: newCategoryName.trim(),
        description: `Category: ${newCategoryName.trim()}`,
        status: 'active'
      });

      // Add to local categories list
      const categoryName = typeof newCategory === 'string' ? 
        newCategory : 
        newCategory.name || newCategory.category_name || newCategoryName.trim();
        
      setCategories(prev => [...prev, categoryName]);
      
      // Select the new category
      onChange(categoryName);
      
      // Reset form
      setNewCategoryName('');
      setShowCreateForm(false);
      setIsOpen(false);
      setSearchTerm('');
      
      console.log('✅ New category created:', categoryName);
    } catch (error) {
      console.error('❌ Error creating category:', error);
      alert('Failed to create category. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleCategorySelect = (category) => {
    onChange(category);
    setIsOpen(false);
    setSearchTerm('');
    setShowCreateForm(false);
  };

  const filteredCategories = categories.filter(category =>
    category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exactMatch = filteredCategories.some(
    category => category.toLowerCase() === searchTerm.toLowerCase()
  );

  const showCreateOption = searchTerm.length > 0 && !exactMatch;

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      {/* Main Select Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '10px 12px',
          border: error ? '1px solid #ef4444' : '1px solid #e5e7eb',
          borderRadius: '6px',
          fontSize: '13px',
          backgroundColor: disabled ? '#f9fafb' : '#ffffff',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          textAlign: 'left',
          color: value ? '#374151' : '#9ca3af',
        }}
      >
        <span>{value || placeholder}</span>
        <FiChevronDown 
          size={16} 
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            zIndex: 1000,
            maxHeight: '300px',
            overflow: 'hidden',
            marginTop: '4px',
          }}
        >
          {/* Search Input */}
          <div style={{
            padding: '12px',
            borderBottom: '1px solid #f3f4f6',
            position: 'sticky',
            top: 0,
            backgroundColor: 'white',
            zIndex: 1001,
          }}>
            <div style={{ position: 'relative' }}>
              <FiSearch 
                size={16} 
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af'
                }}
              />
              <input
                ref={searchRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search categories..."
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Categories List */}
          <div style={{ 
            maxHeight: '200px', 
            overflowY: 'auto',
            padding: '4px 0'
          }}>
            {loading ? (
              <div style={{
                padding: '12px 16px',
                textAlign: 'center',
                color: '#6b7280',
                fontSize: '13px'
              }}>
                Loading categories...
              </div>
            ) : (
              <>
                {filteredCategories.map((category, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleCategorySelect(category)}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      border: 'none',
                      backgroundColor: value === category ? '#f3f4f6' : 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '13px',
                      color: '#374151',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                    onMouseEnter={(e) => {
                      if (value !== category) {
                        e.target.style.backgroundColor = '#f9fafb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (value !== category) {
                        e.target.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <span>{category}</span>
                    {value === category && (
                      <FiCheck size={14} style={{ color: '#10b981' }} />
                    )}
                  </button>
                ))}

                {/* Create New Category Option */}
                {showCreateOption && !showCreateForm && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(true);
                      setNewCategoryName(searchTerm);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '13px',
                      color: '#3b82f6',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      borderTop: filteredCategories.length > 0 ? '1px solid #f3f4f6' : 'none',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#f0f9ff';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                    }}
                  >
                    <FiPlus size={14} />
                    <span>Create "{searchTerm}"</span>
                  </button>
                )}

                {/* No Results */}
                {filteredCategories.length === 0 && !showCreateOption && (
                  <div style={{
                    padding: '12px 16px',
                    textAlign: 'center',
                    color: '#6b7280',
                    fontSize: '13px'
                  }}>
                    No categories found
                  </div>
                )}
              </>
            )}
          </div>

          {/* Create Category Form */}
          {showCreateForm && (
            <div style={{
              padding: '12px',
              borderTop: '1px solid #f3f4f6',
              backgroundColor: '#f8fafc',
            }}>
              <div style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter category name"
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      createCategory();
                    } else if (e.key === 'Escape') {
                      setShowCreateForm(false);
                      setNewCategoryName('');
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={createCategory}
                  disabled={!newCategoryName.trim() || creating}
                  style={{
                    padding: '6px 10px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: creating ? 'wait' : 'pointer',
                    opacity: (!newCategoryName.trim() || creating) ? 0.5 : 1,
                  }}
                >
                  {creating ? '...' : <FiCheck size={12} />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewCategoryName('');
                  }}
                  style={{
                    padding: '6px 8px',
                    backgroundColor: '#f3f4f6',
                    color: '#6b7280',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  <FiX size={12} />
                </button>
              </div>
              <p style={{
                fontSize: '11px',
                color: '#6b7280',
                margin: 0,
                lineHeight: '1.4'
              }}>
                Press Enter to create or Escape to cancel
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CategorySelect; 