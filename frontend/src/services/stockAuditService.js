import { supabase } from '../lib/supabase/index.js';

export const stockAuditService = {
  // Create a new stock audit
  async createAudit(auditData) {
    try {
      const { data, error } = await supabase
        .from('stock_audits')
        .insert([{
          audit_date: auditData.audit_date,
          status: 'draft',
          notes: auditData.notes || null,
          created_by: auditData.created_by || (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error creating audit:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all audits for current user
  async getAudits(filters = {}) {
    try {
      let query = supabase
        .from('stock_audits')
        .select(`
          *,
          stock_audit_items(count)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.dateFrom) {
        query = query.gte('audit_date', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('audit_date', filters.dateTo);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching audits:', error);
      return { success: false, error: error.message };
    }
  },

  // Save audit draft
  async saveDraft(auditData) {
    try {
      // Save to localStorage for now, replace with API when ready
      localStorage.setItem('stock_audit_draft', JSON.stringify(auditData));
      return { success: true };
    } catch (error) {
      console.error('Error saving draft:', error);
      return { success: false, error: error.message };
    }
  },

  // Load audit draft
  async loadDraft() {
    try {
      const draft = localStorage.getItem('stock_audit_draft');
      return { success: true, data: draft ? JSON.parse(draft) : null };
    } catch (error) {
      console.error('Error loading draft:', error);
      return { success: false, error: error.message };
    }
  },

  // Complete audit
  async completeAudit(auditData) {
    try {
      // For now, just log and clear draft
      console.log('Completing audit:', auditData);
      localStorage.removeItem('stock_audit_draft');
      return { success: true };
    } catch (error) {
      console.error('Error completing audit:', error);
      return { success: false, error: error.message };
    }
  },

  // Export audit data
  async exportAuditData(auditData, format = 'csv') {
    try {
      // This is handled in the frontend for now
      return { success: true, data: auditData };
    } catch (error) {
      console.error('Error exporting audit data:', error);
      return { success: false, error: error.message };
    }
  }
};