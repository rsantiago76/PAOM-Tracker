
import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserCog } from 'lucide-react';

const ROLES = ['ADMIN', 'COMPLIANCE', 'OWNER', 'ENGINEER', 'AUDITOR'];

const RoleSwitcher = () => {
    const { user, switchRole, impersonatedRole } = useAuth();

    if (!user) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant={impersonatedRole ? "destructive" : "outline"} className="shadow-lg flex items-center gap-2">
                        <UserCog className="h-4 w-4" />
                        {impersonatedRole ? `Demo: ${impersonatedRole}` : "Demo Role"}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Switch Role (Demo)</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => switchRole(null)} className="font-semibold">
                        Reset to Actual Role
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {ROLES.map(role => (
                        <DropdownMenuItem key={role} onClick={() => switchRole(role)} className={role === user.role ? "bg-slate-100" : ""}>
                            {role}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};

export default RoleSwitcher;
