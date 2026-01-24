import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export default function ValidationResultDialog({ open, onClose, onSubmit, resultType }) {
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (resultType === 'FAIL' && !notes.trim()) {
      alert('Please provide a failure reason');
      return;
    }
    onSubmit(notes);
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-slate-200 flex items-center gap-2">
            {resultType === 'PASS' ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-400" />
                Mark Validation PASS
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Mark Validation FAIL
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {resultType === 'FAIL' && (
            <div className="bg-red-900/20 border border-red-700/40 rounded-lg p-3">
              <p className="text-xs text-red-300">
                Marking validation as FAILED will reopen the "Fix Implemented" milestone and set the finding status to "In Progress".
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-slate-300">
              {resultType === 'FAIL' ? 'Failure Reason / Retest Notes (Required)' : 'Notes (Optional)'}
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={resultType === 'FAIL' 
                ? 'Describe why validation failed and what needs to be fixed...'
                : 'Optional notes about the validation result...'
              }
              className="bg-slate-800 border-slate-700 text-slate-200 min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-slate-600 text-slate-300">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            className={resultType === 'PASS' 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-red-600 hover:bg-red-700'
            }
          >
            {resultType === 'PASS' ? 'Mark PASS' : 'Mark FAIL'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}