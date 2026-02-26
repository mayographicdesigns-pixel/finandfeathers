import React, { useEffect, useRef, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { UploadCloud, Save, RefreshCw } from 'lucide-react';
import { toast } from '../../hooks/use-toast';
import { getPageContent, updatePageContent, uploadImage } from '../../services/api';

const PAGE_CONFIG = [
  { key: 'home', label: 'Home Page', sections: [{ key: 'hero', label: 'Hero Content' }] },
  { key: 'menu', label: 'Menu Page', sections: [{ key: 'hero', label: 'Hero Content' }] },
  { key: 'locations', label: 'Locations Page', sections: [{ key: 'hero', label: 'Hero Content' }] },
  { key: 'events', label: 'Events Page', sections: [{ key: 'hero', label: 'Hero Content' }] },
  { key: 'gallery', label: 'Gallery Page', sections: [{ key: 'hero', label: 'Hero Content' }] },
  { key: 'merch', label: 'Merchandise Page', sections: [{ key: 'hero', label: 'Hero Content' }] },
  { key: 'checkin', label: 'Check-In Page', sections: [{ key: 'hero', label: 'Hero Content' }] }
];

const PageContentTab = () => {
  const [contentMap, setContentMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [uploadTarget, setUploadTarget] = useState(null);
  const quillRefs = useRef({});
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    setLoading(true);
    try {
      const pageContent = {};
      for (const page of PAGE_CONFIG) {
        const result = await getPageContent(page.key);
        pageContent[page.key] = {};
        (result || []).forEach((entry) => {
          pageContent[page.key][entry.section_key] = entry.html || '';
        });
      }
      setContentMap(pageContent);
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (pageKey, sectionKey, value) => {
    setContentMap(prev => ({
      ...prev,
      [pageKey]: {
        ...(prev[pageKey] || {}),
        [sectionKey]: value
      }
    }));
  };

  const handleSave = async (pageKey, sectionKey) => {
    const key = `${pageKey}-${sectionKey}`;
    setSaving(prev => ({ ...prev, [key]: true }));
    try {
      await updatePageContent(pageKey, sectionKey, contentMap?.[pageKey]?.[sectionKey] || '');
      toast({ title: 'Saved', description: 'Page content updated' });
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleImageUpload = (pageKey, sectionKey) => {
    setUploadTarget({ pageKey, sectionKey });
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTarget) return;

    try {
      const result = await uploadImage(file);
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const fullUrl = `${backendUrl}${result.url}`;
      const refKey = `${uploadTarget.pageKey}-${uploadTarget.sectionKey}`;
      const editorRef = quillRefs.current[refKey];
      const editor = editorRef?.getEditor();
      if (editor) {
        const range = editor.getSelection(true) || { index: editor.getLength() };
        editor.insertEmbed(range.index, 'image', fullUrl, 'user');
        editor.setSelection(range.index + 1, 0);
      }
      toast({ title: 'Uploaded', description: 'Image added to content' });
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setUploadTarget(null);
    }
  };

  const getModules = (pageKey, sectionKey) => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ align: [] }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: () => handleImageUpload(pageKey, sectionKey)
      }
    }
  });

  if (loading) {
    return (
      <div className="text-white text-center py-8">Loading page content...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Page Content Editor</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={loadContent}
          className="border-slate-600 text-slate-300"
          data-testid="page-content-refresh"
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        data-testid="page-content-image-input"
      />

      {PAGE_CONFIG.map((page) => (
        <Card key={page.key} className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-lg">{page.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {page.sections.map((section) => {
              const editorKey = `${page.key}-${section.key}`;
              return (
                <div key={section.key} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-slate-300 font-semibold">{section.label}</h4>
                    <Button
                      size="sm"
                      onClick={() => handleSave(page.key, section.key)}
                      className="bg-red-600 hover:bg-red-700"
                      data-testid={`save-page-content-${page.key}-${section.key}`}
                      disabled={saving[editorKey]}
                    >
                      {saving[editorKey] ? 'Saving...' : (
                        <>
                          <Save className="w-4 h-4 mr-2" /> Save
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="bg-white rounded-lg overflow-hidden">
                    <ReactQuill
                      ref={(el) => {
                        quillRefs.current[editorKey] = el;
                      }}
                      theme="snow"
                      value={contentMap?.[page.key]?.[section.key] || ''}
                      onChange={(value) => handleContentChange(page.key, section.key, value)}
                      modules={getModules(page.key, section.key)}
                      data-testid={`page-content-editor-${page.key}-${section.key}`}
                    />
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <UploadCloud className="w-3 h-3" />
                    Use the image tool in the toolbar to upload and insert photos.
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PageContentTab;
